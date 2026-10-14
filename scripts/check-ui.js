#!/usr/bin/env node
// zehn style check. Two modes:
//   Hook mode (no args): reads a PostToolUse JSON payload on stdin and checks only the text the agent just wrote.
//   CLI mode: node check-ui.js <file...>  checks whole files (used by the ui-review skill).
// Exit 2 + stderr in hook mode makes Claude Code show the violations to the agent so it fixes them.
'use strict';
const fs = require('fs');
const path = require('path');

const UI_EXT = /\.(tsx|jsx|ts|js|vue|svelte|astro|html|css|scss|sass|less|dart|swift|kt)$/i;
const SKIP = /(node_modules|\/dist\/|\/build\/|\.next\/|tokens\.(css|json|js)|tailwind\.(config|preset)\.[cm]?[jt]s|\.test\.|\.spec\.|\.stories\.|\/zehn\/)/;

const SPACE = new Set([0, 1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64, 72, 96, 128, 256, 320, 512]);
const RADIUS = new Set([0, 2, 4, 8, 12, 16, 24, 32, 9999]);
const FONT_SIZE = new Set([10, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72]);
const TW_HUES = 'slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const TW_COLOR_PROPS = 'bg|text|border|border-[trblxy]|ring|ring-offset|outline|fill|stroke|from|via|to|divide|placeholder|caret|accent|decoration|shadow';
const TW_SPACING_PROPS = 'p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|inset|top|right|bottom|left';

const RULES = [
  { id: 'hex-color', re: /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b(?![\w-])/g,
    msg: 'Hardcoded hex color. Use a token: var(--zm-text-primary), var(--zm-status-danger)… (see reference/tokens.md).',
    skipIf: (line) => /^\s*(\/\/|\*|<!--)/.test(line) || /href=|url\(|#[0-9a-f]{3,8}-|&#/.test(line) },
  { id: 'rgb-hsl', re: /\b(?:rgba?|hsla?|oklch|lab)\(\s*\d/g,
    msg: 'Hardcoded rgb/hsl color. Use a --zm-* token.' },
  { id: 'tw-default-palette', re: new RegExp(`(?<![\\w-])(?:[a-z0-9:-]+:)?(?:${TW_COLOR_PROPS})-(?:${TW_HUES})-\\d{2,3}(?:\\/\\d+)?(?![\\w-])`, 'g'),
    msg: 'Tailwind default palette class. zehn replaces the palette: use bg-surface-*, text-text-*, bg-primary-bg, text-status-*, bg-cyan-fill-2…' },
  { id: 'tw-arbitrary-color', re: new RegExp(`(?<![\\w-])(?:[a-z0-9:-]+:)?(?:${TW_COLOR_PROPS})-\\[(?!var\\(--zm-)[^\\]]+\\]`, 'g'),
    msg: 'Arbitrary Tailwind color/value. Use a theme class or [var(--zm-…)].' },
  { id: 'tw-arbitrary-spacing', re: new RegExp(`(?<![\\w-])-?(?:[a-z0-9:-]+:)?(?:${TW_SPACING_PROPS})-\\[(?!var\\(--zm-)[^\\]]+\\]`, 'g'),
    msg: 'Arbitrary spacing. Use the scale: 0 1 2 4 6 8 10 12 16 20 24 32 40 48 64… (e.g. p-16, gap-12).' },
  { id: 'tw-arbitrary-type', re: /(?<![\w-])(?:[a-z0-9:-]+:)?(?:text|leading|tracking|font|rounded(?:-[trbl]{1,2})?)-\[(?!var\(--zm-)[^\]]+\]/g,
    msg: 'Arbitrary font size/weight/radius. Use text-xs…text-2xl, font-normal/font-semibold, rounded-4/8/12/16/full.' },
  { id: 'font-weight', re: /(?:font-weight\s*:\s*(?:[1-57-9]00|bold|bolder|lighter)\b|fontWeight\s*:\s*['"]?(?:[1-57-9]00|bold)\b|\bfont-(?:thin|extralight|light|medium|bold|extrabold|black)\b)/g,
    msg: 'Only two weights exist: 400 (font-normal) and 600 (font-semibold).' },
  { id: 'font-family', re: /font-family\s*:\s*(?!\s*(?:var\(--zm-font|['"]?Inter|inherit))[^;]+|fontFamily\s*:\s*['"](?!Inter|var\(--zm)[^'"]+['"]/g,
    msg: 'Only Inter (var(--zm-font-sans)) is allowed.' },
];

function cssPxRules(line) {
  const out = [];
  const re = /\b(padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left|border-radius|font-size)(?:-[a-z]+)?\s*:\s*([^;}{]+)/g;
  let m;
  while ((m = re.exec(line))) {
    const prop = m[1];
    const nums = [...m[2].matchAll(/(-?\d+(?:\.\d+)?)px/g)].map((x) => Math.abs(parseFloat(x[1])));
    const set = prop === 'border-radius' ? RADIUS : prop === 'font-size' ? FONT_SIZE : SPACE;
    const bad = nums.filter((n) => !set.has(n));
    if (bad.length) out.push({ id: 'off-scale', text: m[0].trim(),
      msg: `Off-scale ${prop}: ${bad.join('px, ')}px. Use var(--zm-space-*), var(--zm-radius-*) or a text style.` });
  }
  const js = /\b(padding|margin|gap|fontSize|borderRadius)(?:Top|Right|Bottom|Left|X|Y|Horizontal|Vertical)?\s*:\s*(\d+(?:\.\d+)?)\b/g;
  while ((m = js.exec(line))) {
    const n = parseFloat(m[2]);
    const set = m[1] === 'borderRadius' ? RADIUS : m[1] === 'fontSize' ? FONT_SIZE : SPACE;
    if (!set.has(n)) out.push({ id: 'off-scale', text: m[0], msg: `Off-scale ${m[1]}: ${n}. Use the zehn scale.` });
  }
  return out;
}

function check(text, file) {
  const problems = [];
  text.split('\n').forEach((line, i) => {
    if (/zehn-ignore/.test(line)) return;
    for (const r of RULES) {
      if (r.skipIf && r.skipIf(line)) continue;
      r.re.lastIndex = 0;
      let m;
      while ((m = r.re.exec(line))) problems.push({ line: i + 1, id: r.id, text: m[0].trim(), msg: r.msg });
    }
    for (const p of cssPxRules(line)) problems.push({ line: i + 1, ...p });
  });
  return problems.map((p) => ({ file, ...p }));
}

function format(problems) {
  const seen = new Set();
  const lines = [];
  for (const p of problems) {
    const k = p.id + p.text;
    if (seen.has(k)) continue;
    seen.add(k);
    lines.push(`- ${p.file ? path.basename(p.file) : ''}${p.line ? ':' + p.line : ''} \`${p.text.slice(0, 80)}\`: ${p.msg}`);
    if (lines.length >= 25) { lines.push(`…and more (${problems.length} total).`); break; }
  }
  return lines.join('\n');
}

function hookMode(raw) {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }
  const ti = input.tool_input || {};
  const file = ti.file_path || ti.path || '';
  if (!UI_EXT.test(file) || SKIP.test(file)) process.exit(0);
  const chunks = [];
  if (typeof ti.content === 'string') chunks.push(ti.content);
  if (typeof ti.new_string === 'string') chunks.push(ti.new_string);
  if (Array.isArray(ti.edits)) ti.edits.forEach((e) => typeof e.new_string === 'string' && chunks.push(e.new_string));
  const problems = check(chunks.join('\n'), file).map((p) => ({ ...p, line: 0 }));
  if (!problems.length) process.exit(0);
  process.stderr.write(
    `zehn design system: the code you just wrote in ${path.basename(file)} breaks the style rules. Fix these now, using tokens and components from the zehn-design plugin:\n` +
    format(problems) +
    `\nIf a value truly has no token, keep it, add a trailing comment "zehn-ignore: <reason>", and mention it in your final message as a design gap.\n`);
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length) {
  const all = [];
  for (const f of args) {
    if (!UI_EXT.test(f) || SKIP.test(f) || !fs.existsSync(f)) continue;
    all.push(...check(fs.readFileSync(f, 'utf8'), f));
  }
  if (!all.length) { console.log('zehn style check: clean'); process.exit(0); }
  console.log(`zehn style check: ${all.length} issue(s)\n` + format(all));
  process.exit(1);
} else {
  let raw = '';
  process.stdin.on('data', (d) => (raw += d));
  process.stdin.on('end', () => hookMode(raw));
}
