#!/usr/bin/env node
// zehn style check. Three modes:
//   Hook mode (no args): reads a PostToolUse payload (Edit/Write/MultiEdit) on stdin and checks only the lines
//     the agent actually changed (re-indented or untouched old lines are not blamed on it).
//   --session-start / --stop: snapshot uncommitted changes at session start; at stop, check every line added
//     since then (this also catches edits made through Bash or scripts).
//   CLI mode: node check-ui.js <file...>  checks whole files (used by the ui-review skill).
// Exit 2 + stderr in hook modes makes Claude Code show the violations to the agent so it fixes them.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const UI_EXT = /\.(tsx|jsx|ts|js|mjs|cjs|vue|svelte|astro|html|css|scss|sass|less|dart|swift|kt)$/i;
const SKIP = /(node_modules|\/dist\/|\/build\/|\.next\/|(^|\/)tokens\.(css|json)$|tailwind\.(config|preset)\.[cm]?[jt]s$|ZehnTokens\.(swift|kt)$|zehn_tokens\.dart$|\.test\.|\.spec\.|\.stories\.|\.d\.ts$)/;
const lang = (f) => (/\.(css|scss|sass|less)$/i.test(f) ? 'css' : /\.swift$/i.test(f) ? 'swift' : /\.dart$/i.test(f) ? 'dart' : /\.kt$/i.test(f) ? 'kotlin' : 'web');

// ---------- scales ----------
const SPACE = new Set([0, 1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64, 72, 96, 128, 256, 320, 512]);
const RADIUS = new Set([0, 2, 4, 8, 12, 16, 24, 32, 9999]);
const FONT_SIZE = new Set([10, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72]);
const TW_SPACE_KEYS = new Set(['0', 'px', '0.5', '1', '1.5', '2', '2.5', '3', '4', '5', '6', '8', '10', '12', '16', '18', '24', '32', '64', '80', '128']);
const SPACE_HINT = 'zehn spacing (Tailwind keys): 0 px 0.5 1 1.5 2 2.5 3 4 5 6 8 10 12 16 18 24 32 = 0 1 2 4 6 8 10 12 16 20 24 32 40 48 64 72 96 128px; 64 80 128 (256/320/512px) for section spacing only';
const REF = path.resolve(__dirname, '../reference/tokens.md');
const IGNORE_FMT = '"zehn-ignore: requested by <who>, <why>"';
const IGNORE_SYNTAX = '(// in JS/TS, {/* */} in JSX children, /* */ in CSS, <!-- --> in HTML)';

// Known --zm-* variables, read from the plugin's tokens.css.
const KNOWN_VARS = (() => {
  try {
    const css = fs.readFileSync(path.resolve(__dirname, '../tokens/tokens.css'), 'utf8');
    return new Set([...css.matchAll(/(--zm-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  } catch { return null; }
})();
// Nearest known --zm-* name (edit distance), for the unknown-token message.
function closestVar(name) {
  if (!KNOWN_VARS) return null;
  const dist = (a, b) => {
    const d = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = d[0]; d[0] = i;
      for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; }
    }
    return d[b.length];
  };
  let best = null, bestD = Infinity;
  for (const v of KNOWN_VARS) { const x = dist(name, v); if (x < bestD) { bestD = x; best = v; } }
  return bestD <= Math.max(3, Math.floor(name.length / 4)) ? best : null;
}
// Color keys in the preset (so we can tell a real color class from one that renders nothing).
const COLOR_KEYS = (() => {
  try { return new Set(Object.keys(require('../tokens/tailwind.preset.cjs').theme.colors)); } catch { return null; }
})();

// ---------- project mode (zehn.project.json) ----------
// When the app has a zehn.project.json (found by walking up from the checked file), the check enforces the app's own
// tokens and components; the zehn tokens only count when fallback.zehnTokens is true. Missing or invalid JSON → zehn mode.
const PROJECT_FILE = 'zehn.project.json';
const projectByDir = new Map();
function findProject(dir) {
  if (projectByDir.has(dir)) return projectByDir.get(dir);
  let proj = null;
  const f = path.join(dir, PROJECT_FILE);
  if (fs.existsSync(f)) {
    try { proj = buildProject(dir, JSON.parse(fs.readFileSync(f, 'utf8'))); } catch { proj = null; }
  } else {
    const up = path.dirname(dir);
    proj = up === dir ? null : findProject(up);
  }
  projectByDir.set(dir, proj);
  return proj;
}
const arr = (x) => (Array.isArray(x) ? x.filter((v) => typeof v === 'string' && v) : []);
function flattenColors(obj, prefix, out) {
  if (!obj || typeof obj !== 'object') return;
  for (const [k, v] of Object.entries(obj)) {
    const key = k === 'DEFAULT' ? prefix : prefix ? `${prefix}-${k}` : k;
    if (v && typeof v === 'object') flattenColors(v, key, out);
    else if (key) out.add(key);
  }
}
function buildProject(root, j) {
  if (!j || typeof j !== 'object') return null;
  const t = j.tokens || {};
  const fb = j.fallback || {};
  const comps = j.components || {};
  const sources = arr(t.sources).map((s) => path.resolve(root, s));
  const vars = new Set();
  const colors = new Set(['transparent', 'current', 'inherit', 'black', 'white', ...arr(t.tailwindColors)]);
  for (const src of sources) {
    let text;
    try { text = fs.readFileSync(src, 'utf8'); } catch { continue; }
    if (/\.json$/i.test(src)) {
      try { const c = JSON.parse(text); const th = c.theme || c; flattenColors(th.colors, '', colors); flattenColors(th.extend && th.extend.colors, '', colors); } catch {}
      continue;
    }
    for (const m of text.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) {
      vars.add(m[1]);
      const c = /^--color-(.+)$/.exec(m[1]); // Tailwind v4 @theme: --color-primary → bg-primary
      if (c) colors.add(c[1]);
    }
  }
  const zehnTokens = fb.zehnTokens === true;
  if (zehnTokens) {
    for (const v of KNOWN_VARS || []) vars.add(v);
    for (const c of COLOR_KEYS || []) colors.add(c);
  }
  const dirs = [comps.dir, fb.zehnDir].filter((d) => typeof d === 'string' && d.trim()).map((d) => path.resolve(root, d));
  const map = comps.map && typeof comps.map === 'object' ? comps.map : {};
  return {
    root, sources, vars, colors, zehnTokens, dirs, map,
    prefixes: arr(t.cssVarPrefixes),
    spaceKeys: arr(t.spacingKeys).length ? new Set(arr(t.spacingKeys)) : TW_SPACE_KEYS,
  };
}
const ZEHN_MODE = { project: null, zehnTokens: true, colors: COLOR_KEYS, spaceKeys: TW_SPACE_KEYS, dirs: [], fileVars: new Set() };
let CTX = ZEHN_MODE; // the context of the file being checked
function contextFor(file) {
  const proj = file ? findProject(path.dirname(path.resolve(file))) : null;
  if (!proj) return ZEHN_MODE;
  let fileVars = new Set();
  try { fileVars = new Set([...fs.readFileSync(file, 'utf8').matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)].map((m) => m[1])); } catch {}
  return { project: proj, zehnTokens: proj.zehnTokens, colors: proj.colors.size > 5 ? proj.colors : null, spaceKeys: proj.spaceKeys, dirs: proj.dirs, fileVars };
}
function knownProjectVar(name) {
  const p = CTX.project;
  return p.vars.has(name) || CTX.fileVars.has(name) || p.prefixes.some((x) => name.startsWith(x));
}
const inside = (abs, dirs) => dirs.some((d) => abs === d || abs.startsWith(d + path.sep));
// Files the check never looks at: generated/vendor files, and the project's own token sources.
function skipped(file) {
  if (!UI_EXT.test(file) || SKIP.test(file)) return true;
  const proj = findProject(path.dirname(path.resolve(file)));
  return !!proj && proj.sources.includes(path.resolve(file));
}
// "Use <their component> from <import>" for a catalog name, if the project maps it.
function mapped(name) {
  const e = CTX.project && CTX.project.map[name];
  return e && e.component ? `${e.component}${e.import ? ` from ${e.import}` : ''}` : null;
}
const PROJECT_REF = 'the project\'s tokens (zehn.project.json tokens.sources)';

const NAMED = 'aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|grey|green|greenyellow|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen';
const TW_HUES = 'slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const COLOR_PROPS = 'bg|text|border|border-[xytrblse]|ring|ring-offset|outline|fill|stroke|from|via|to|divide|placeholder|caret|accent|decoration|shadow';
const V = '(?:[a-z0-9-]+:)*'; // variants like hover: md: dark:

// ---------- web (JS/TS/JSX/Vue/HTML) + CSS rules ----------
const MSG = {
  hex: () => (CTX.project ? `Hardcoded hex color. Use ${PROJECT_REF}.` : `Hardcoded hex color. Use a token: var(--zm-text-primary), bg-status-danger-bg… (${REF}).`),
  rgb: () => CTX.project ? `Hardcoded rgb/hsl color. Use ${PROJECT_REF}.` : 'Hardcoded rgb/hsl color. Text → text-text-primary/secondary/tertiary; surfaces → bg-surface-base/subtle/raised; borders → border-border-default; status → text-status-* / bg-status-*-bg; translucent black → gray-*.',
  named: () => (CTX.project ? `Named CSS color. Use ${PROJECT_REF}.` : 'Named CSS color. Use a --zm-* token (e.g. var(--zm-text-primary), var(--zm-const-white)).'),
  palette: () => (CTX.project ? 'Tailwind default palette class that isn\'t in the project\'s colors (zehn.project.json tokens.tailwindColors). Use one of the project\'s color classes.' : 'Tailwind default palette class. It renders nothing under the zehn preset. Use bg-surface-*, text-text-*, bg-primary-bg, text-status-*, bg-cyan-fill-2…'),
  deadColor: () => (CTX.project ? 'Not one of the project\'s colors (zehn.project.json tokens.tailwindColors). Use an existing color class.' : 'This color class renders nothing under the zehn preset (no such token). Use a zehn color: text-text-secondary, bg-surface-subtle, border-border-default…'),
  arbColor: () => (CTX.project ? 'Arbitrary Tailwind value. Use a theme class or [var(--<project token>)].' : 'Arbitrary Tailwind value. Use a theme class or [var(--zm-…)].'),
  arbSpace: `Arbitrary spacing. ${SPACE_HINT}.`,
  arbType: 'Arbitrary font size/weight/radius/tracking. Use text-xs…text-2xl, font-normal/font-semibold, rounded/rounded-lg/xl/2xl/full.',
  arbSize: 'Arbitrary size/z-index. Use a standard Tailwind size key or a zehn layout key: max-w-column-narrow, max-w-column-detail, w-modal, w-drawer, h-topbar-height, h-row…',
  offSpace: () => (CTX.project && CTX.spaceKeys !== TW_SPACE_KEYS ? `Off-scale spacing class. The project's spacing keys (zehn.project.json): ${[...CTX.spaceKeys].join(' ')}.` : `Off-scale spacing class. ${SPACE_HINT}.`),
  radius: 'Off-scale or unknown radius. Pick by element: rounded (4) cards, panels, tables, banners, toasts, badges, small buttons · rounded-lg (8) buttons, inputs, menus · rounded-xl (12) modals · rounded-2xl (16) mobile cards · rounded-full avatars, counters, switches.',
  shadow: 'Default Tailwind shadow renders nothing under the zehn preset. Web cards: a 1px border-border-default, no shadow. shadow-100 raised controls · shadow-200 tooltips, toasts · shadow-300 menus, modals, drawers · shadow-focus.',
  textSize: 'No such text size. App UI: text-xs 12 meta · text-sm 14 body · text-base 16 · text-lg 18 · text-2xl 24 H1. text-3xl…7xl are for mobile large titles and marketing pages only.',
  weight: 'Only 400 and 600 exist: 300/500 → font-normal, 700/bold → font-semibold.',
  family: 'Only Inter: remove the font-family; it inherits var(--zm-font-sans). For aligned numbers use tabular-nums.',
  unknownProjectVar: (name) => `Unknown token: ${name} isn't declared in ${PROJECT_REF}. Use an existing token.`,
  unknownVar: (name) => `Unknown zehn token: ${name} does not exist.${closestVar(name) ? ` Did you mean ${closestVar(name)}?` : ''} See ${REF}.`,
  ignore: `zehn-ignore needs who asked and why: ${IGNORE_FMT}, and a Design gaps line.`,
};

const SINGLE_WORD_UTILS = new Set('flex grid block inline inline-block inline-flex inline-grid hidden contents table relative absolute fixed sticky static truncate underline uppercase lowercase capitalize italic rounded border shadow grow shrink container ring outline transition invisible visible isolate group peer sr-only antialiased overflow-hidden'.split(' '));
function quotedSegment(line, idx) {
  // The quoted string ('', "", ``) that contains position idx, or null.
  const re = /(["'`])((?:\\.|(?!\1).)*)\1/g;
  let m;
  while ((m = re.exec(line))) if (m.index < idx && idx < m.index + m[0].length) return m[2];
  return null;
}
function classLike(s) {
  const toks = s.trim().split(/\s+/).filter(Boolean);
  if (!toks.length) return false;
  return toks.every((t) => /[-:[]/.test(t) ? /^[!\-]?[\w:[\]()/.\-%#,'=&>~*@]+$/.test(t) : SINGLE_WORD_UTILS.has(t)) && toks.some((t) => /-/.test(t));
}
const CLASS_CTX = /\bclass(Name)?\s*=|:class=|\b(cn|clsx|cx|cva|twMerge|twJoin|classNames|classnames)\(|\btw`|@apply|classList/;
function inClassContext(line, idx, kind) {
  if (kind === 'css') return /@apply/.test(line);
  const seg = quotedSegment(line, idx);
  if (seg === null) return /@apply/.test(line);
  return CLASS_CTX.test(line) || classLike(seg);
}

const WEB_RULES = [
  { id: 'hex-color', msg: MSG.hex, re: /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b(?![\w-])/g,
    ok: (line, i, kind) => {
      if (/^\s*(\/\/|\*|<!--|\/\*)/.test(line) || /&#/.test(line)) return true;
      const before = line.slice(0, i);
      if (kind === 'css') return !/[a-z-]+\s*:\s*[^;{}]*$/i.test(before) || /^[^;]*\{/.test(line.slice(i)); // selectors like #fade {
      // web: only flag in color-ish contexts, not "Fixes #123" or "#add" anchors
      if (/href=|to=|url\(|location|hash/.test(line)) return true;
      if (/["'`[(:=,]\s*$/.test(before)) return false;
      return !/\b(solid|dashed|dotted|px|gradient|shadow|color|fill|stroke|border|background)\b[^"'`]*$/i.test(before);
    } },
  { id: 'rgb-hsl', msg: MSG.rgb, re: /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(\s*(?:[\d.]|var\((?!--zm-))/g,
    ok: (line, i) => /^\s*(\/\/|\*|\/\*)/.test(line) || (!!CTX.project && /^[a-z]+\(\s*var\(/.test(line.slice(i))) }, // project: hsl(var(--primary)); the var is checked below
  { id: 'named-color', msg: MSG.named,
    re: new RegExp(`\\b(?:color|background(?:-color)?|border(?:-[a-z]+)?-color|border(?:-[a-z]+)?|outline(?:-color)?|fill|stroke|caret-color|text-decoration(?:-color)?|accent-color|box-shadow)\\s*:\\s*(?:[^;'"{}]*\\s)?(?:${NAMED})\\b(?![-\\w])`, 'g') },
  // CSS-in-JS: unambiguous keys always; color/fill/stroke/background only in a style context (not data like { color: 'green' }).
  { id: 'named-color', msg: MSG.named,
    re: new RegExp(`\\b(color|fill|stroke|background|backgroundColor|borderColor|borderTopColor|borderBottomColor|outlineColor|textDecorationColor|caretColor|accentColor|border|borderTop|borderRight|borderBottom|borderLeft|outline|boxShadow|textDecoration)\\s*:\\s*['"\`](?:[^'"\`]*\\s)?(?:${NAMED})\\b(?![-\\w])`, 'g'),
    ok: (line, i, kind, m) => /^(color|fill|stroke|background)$/.test(m[1]) && !/\bstyle\b|\bsx\b|\bcss\b|styled|StyleSheet|CSSProperties/.test(line) },
  { id: 'important', msg: 'Overriding zehn styles with !important is not allowed. Use the component\'s props or variant, or a token class. If no prop does it, list it under Design gaps.',
    re: /!important\b/g, ok: (line) => /^\s*(\/\/|\*|\/\*)/.test(line) },
  { id: 'tw-default-palette', msg: MSG.palette, cls: true,
    re: new RegExp(`(?<![\\w-])${V}(?:${COLOR_PROPS})-(?:${TW_HUES}|gray)-\\d{2,3}(?:\\/\\d+)?(?![\\w-])`, 'g'),
    ok: (line, i, kind, m) => {
      const key = m[0].replace(/^.*?-((?:[a-z]+)-\d{2,3})(?:\/\d+)?$/, '$1');
      if (CTX.project) return !!CTX.colors && (CTX.colors.has(key) || CTX.colors.has(key.replace(/-\d+$/, '')));
      return /^gray-/.test(key) && !!COLOR_KEYS && COLOR_KEYS.has(key);
    } },
  { id: 'tw-arbitrary-color', msg: MSG.arbColor, cls: true,
    re: new RegExp(`(?<![\\w-])${V}(?:${COLOR_PROPS})-\\[(?!var\\(--zm-)(?!\\d)[^\\]]+\\]`, 'g'),
    ok: (line, i, kind, m) => !!CTX.project && /\[var\(--/.test(m[0]) },
  { id: 'tw-arbitrary-spacing', msg: MSG.arbSpace, cls: true,
    re: new RegExp(`(?<![\\w-])${V}-?(?:p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|inset|inset-x|inset-y|top|right|bottom|left|start|end|scroll-m|scroll-p)-\\[(?!var\\(--zm-)[^\\]]+\\]`, 'g'),
    ok: (line, i, kind, m) => !!CTX.project && /\[var\(--/.test(m[0]) },
  { id: 'tw-arbitrary-type', msg: MSG.arbType, cls: true,
    re: new RegExp(`(?<![\\w-])${V}(?:text|leading|tracking|font|rounded(?:-[trblse]{1,2})?)-\\[(?!var\\(--zm-)[^\\]]+\\]`, 'g'),
    ok: (line, i, kind, m) => !!CTX.project && /\[var\(--/.test(m[0]) },
  { id: 'tw-arbitrary-size', msg: MSG.arbSize, cls: true,
    re: new RegExp(`(?<![\\w-])${V}-?(?:w|h|min-w|max-w|min-h|max-h|size|z|basis)-\\[(?!var\\(--zm-)[^\\]]+\\]`, 'g'),
    ok: (line, i, kind, m) => !!CTX.project && /\[var\(--/.test(m[0]) },
  { id: 'off-scale-class', msg: MSG.offSpace, cls: true,
    re: new RegExp(`(?<![\\w-])${V}-?(?:p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y)-([\\d.]+|px)(?![\\w.-]|\\/)`, 'g'),
    ok: (line, i, kind, m) => CTX.spaceKeys.has(m[1]) },
  { id: 'radius', zehnScale: true, msg: MSG.radius, cls: true,
    re: new RegExp(`(?<![\\w-])${V}rounded(?:-[trblse]{1,2})?-(md|\\d+)(?![\\w-])`, 'g') },
  { id: 'shadow', zehnScale: true, msg: MSG.shadow, cls: true,
    re: new RegExp(`(?<![\\w-])${V}shadow(?:-(?:sm|md|lg|xl|2xl|inner))?(?![\\w-])`, 'g'),
    ok: (line, i) => /^\s*(\/\/|\*)/.test(line) },
  { id: 'text-size', zehnScale: true, msg: MSG.textSize, cls: true, re: new RegExp(`(?<![\\w-])${V}text-(?:8xl|9xl)(?![\\w-])`, 'g') },
  { id: 'font-weight', zehnScale: true, msg: MSG.weight,
    re: /font-weight\s*:\s*(?:[12357-9]00|bold|bolder|lighter)\b|fontWeight\s*:\s*['"]?(?:[12357-9]00|bold|bolder|lighter)\b/g },
  { id: 'font-weight-class', zehnScale: true, msg: MSG.weight, cls: true,
    re: new RegExp(`(?<![\\w-])${V}font-(?:thin|extralight|light|medium|bold|extrabold|black)(?![\\w-])`, 'g') },
  { id: 'font-family', msg: MSG.family,
    re: /font-family\s*:\s*(?!\s*(?:var\(--zm-font|['"]?Inter\b|inherit|initial|unset))[^;}]+|fontFamily\s*:\s*['"`]+(?!Inter\b|var\(--zm)[^'"`,]+/g,
    ok: (line, i, kind, m) => !!CTX.project && /var\(--/.test(m[0]) },
  { id: 'font-shorthand', msg: MSG.family, re: /(?<![\w-])font\s*:\s*([^;}]+)/g,
    ok: (line, i, kind, m) => /Inter\b|var\(--zm|inherit|initial|unset/.test(m[1]) || !/\d/.test(m[1]) },
  { id: 'unknown-token', mode: 'project', msg: (m) => MSG.unknownProjectVar(m[1]), re: /var\(\s*(--[A-Za-z0-9_-]+)/g,
    ok: (line, i, kind, m) => knownProjectVar(m[1]) },
  { id: 'unknown-token', mode: 'zehn', msg: (m) => MSG.unknownVar(m[0]), re: /--zm-[a-z0-9-]+/g,
    ok: (line, i, kind, m) => !KNOWN_VARS || KNOWN_VARS.has(m[0]) || /:\s*$/.test(line.slice(0, i + m[0].length + 1)) || /^\s*--zm-[a-z0-9-]+\s*:/.test(line.slice(i)) },
];

function deadColorClasses(line, kind, push) {
  if (!CTX.colors) return;
  const NON_COLOR = {
    bg: /^(none|fixed|local|scroll|clip-.+|origin-.+|repeat.*|no-repeat|auto|cover|contain|center|top|bottom|left|right|(left|right)-(top|bottom)|gradient-.+|blend-.+|opacity-\d+)$/,
    text: /^(xxs|xs|sm|base|lg|[2-9]?xl|header-icon|left|center|right|justify|start|end|ellipsis|clip|wrap|nowrap|balance|pretty|opacity-\d+)$/,
    border: /^(\d+|x|y|t|r|b|l|s|e|[xytrblse]-\d+|solid|dashed|dotted|double|hidden|none|collapse|separate|spacing-.+|opacity-\d+)$/,
    ring: /^(\d+|inset|offset-\d+|opacity-\d+)$/, outline: /^(none|dashed|dotted|double|\d+|offset-\d+)$/,
    divide: /^(x|y|x-\d+|y-\d+|solid|dashed|dotted|double|none|opacity-\d+)$/, fill: /^(none)$/, stroke: /^(\d+|none)$/,
    decoration: /^(\d+|auto|from-font|solid|double|dotted|dashed|wavy|slice|clone)$/, placeholder: /^(opacity-\d+)$/,
    from: /^(\d+%)$/, via: /^(\d+%)$/, to: /^(\d+%)$/, caret: /^$/, accent: /^(auto)$/,
  };
  const re = new RegExp(`(?<![\\w-\\[])${V}(bg|text|border(?:-[xytrblse])?|ring|outline|divide|fill|stroke|decoration|placeholder|from|via|to|caret|accent)-([a-z][a-z0-9-]*?)(?:\\/\\d+)?(?![\\w-\\[])`, 'g');
  let m;
  while ((m = re.exec(line))) {
    const base = m[1].startsWith('border') ? 'border' : m[1];
    const val = m[2];
    if (NON_COLOR[base] && NON_COLOR[base].test(val)) continue;
    if (m[1] !== 'border' && /^border-/.test(m[1]) && /^\d+$/.test(val)) continue;
    if (CTX.colors.has(val)) continue;
    if (!inClassContext(line, m.index, kind)) continue;
    push(m.index, m[0], 'dead-class', MSG.deadColor());
  }
}

// Tailwind's !important prefix (!p-2, hover:!bg-x) inside a class string.
function importantClasses(line, push) {
  const re = /(["'`])((?:\\.|(?!\1).)*)\1/g;
  let m;
  while ((m = re.exec(line))) {
    if (!classLike(m[2]) && !CLASS_CTX.test(line)) continue;
    const t = /(?:^|\s)((?:[a-z0-9-]+:)*![a-z][\w\-[\]/.:]*)/g;
    let c;
    while ((c = t.exec(m[2]))) push(m.index + 1 + c.index, c[1], 'important', 'Tailwind !important override. Use the component\'s props or variant, or a token class. If no prop does it, list it under Design gaps.');
  }
}

// Hand-made primitives in app code. Skipped inside component libraries: the zehn components (components/zehn,
// the plugin's components/react) and, in project mode, components.dir and fallback.zehnDir.
const OWN_COMPONENTS = /components\/(zehn|react)\//;
function inComponentLibrary(file) {
  return OWN_COMPONENTS.test(file) || inside(path.resolve(file), CTX.dirs);
}
const use = (name, zehn) => (mapped(name) ? `Use ${mapped(name)} (zehn.project.json).` : `Use the app's ${name} (see zehn.project.json) or the zehn ${zehn}.`);
const PRIMITIVES = [
  [/<button\b/g, () => `Raw <button>. ${use('Button', 'Button / IconButton aria-label')} Clickable table row → the table's row click. Tooltip on a disabled action → Button disabledReason.`],
  [/<select\b/g, () => `Raw <select>. ${use('Select', 'Select')}`],
  [/<input\b[^>]*type=["'](?:checkbox|radio)["']/g, () => `Raw checkbox/radio. ${use('Checkbox', 'Checkbox, Radio or Switch')}`],
  [/<dialog\b|\bwindow\.confirm\(|(?<![\w.])confirm\(\s*['"`]|(?<![\w.])alert\(\s*['"`]/g, () => `Native dialog. ${use('AlertDialog', 'Modal, AlertDialog (destructive confirm) or a Toast')}`],
];
function rawPrimitives(line, push) {
  if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
  for (const [re, msg] of PRIMITIVES) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(line))) push(m.index, m[0], 'raw-primitive', msg());
  }
}

// Project mode: a new component outside components.dir whose name looks like a mapped one (PrimaryButton, MyModal,
// StatusPill…). Agents drift by inventing these; the app's own component should be used or extended instead.
const SYNONYMS = { Badge: ['Pill', 'Tag', 'Chip'], Modal: ['Dialog', 'Popup'], AlertDialog: ['Confirm'], Drawer: ['Sheet', 'SidePanel'],
  Toast: ['Snackbar', 'Notification'], Button: ['Btn'], Select: ['Dropdown'], Tooltip: ['Hint'], Input: ['TextField'], Avatar: ['UserPic'] };
const NOT_COMPONENT = /(Context|Props|Provider|Group|Store|Type|Types|State|Ref|Schema|Variants|Styles|Config)$/;
function lookalike(name) {
  if (!CTX.project || NOT_COMPONENT.test(name)) return null;
  const words = name.match(/[A-Z][a-z0-9]*/g) || [];
  for (const [catalog, e] of Object.entries(CTX.project.map)) {
    const names = [catalog, e && e.component, ...(SYNONYMS[catalog] || [])].filter((x) => typeof x === 'string' && /^[A-Z]/.test(x));
    for (const n of names) {
      const nw = n.match(/[A-Z][a-z0-9]*/g) || [n];
      for (let i = 0; i + nw.length <= words.length; i++) {
        if (nw.every((w, k) => words[i + k] === w)) return { catalog, entry: e || {} };
      }
    }
  }
  return null;
}
const dupMsg = (hit) => `Looks like a new ${hit.catalog}. Use ${hit.entry.component || hit.catalog}${hit.entry.import ? ` from ${hit.entry.import}` : ''}; if it can't do this, extend it there and list it as a design gap.`;
const COMPONENT_DEF = /(?:^|[^\w.])(?:export\s+(?:default\s+)?)?(?:function\s+([A-Z]\w*)\s*[(<]|(?:const|let)\s+([A-Z]\w*)\s*(?::[^=]+)?=\s*(?:React\.)?(?:\(|forwardRef|memo|styled|function|async\s*\()|class\s+([A-Z]\w*)\s+extends)/g;
function duplicateComponents(line, push) {
  if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
  COMPONENT_DEF.lastIndex = 0;
  let m;
  while ((m = COMPONENT_DEF.exec(line))) {
    const name = m[1] || m[2] || m[3];
    const hit = lookalike(name);
    if (hit && !(hit.entry.component === name)) push(m.index, name, 'duplicate-component', dupMsg(hit));
  }
}

function cssPx(line, push) {
  const re = /\b(padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left|border-radius|font-size)(?:-[a-z]+)?\s*:\s*([^;}{]+)/g;
  let m;
  while ((m = re.exec(line))) {
    const prop = m[1];
    const nums = [...m[2].matchAll(/(-?\d+(?:\.\d+)?)px/g)].map((x) => Math.abs(parseFloat(x[1])));
    const set = prop === 'border-radius' ? RADIUS : prop === 'font-size' ? FONT_SIZE : SPACE;
    if (set !== SPACE && !CTX.zehnTokens) continue;
    const bad = nums.filter((n) => !set.has(n));
    if (bad.length) push(m.index, m[0].trim(), 'off-scale', `Off-scale ${prop}: ${bad.join('px, ')}px. Use var(--zm-space-*), var(--zm-radius-*) or a text style.`);
  }
  const js = /\b(padding|margin|gap|rowGap|columnGap|fontSize|borderRadius)(?:Top|Right|Bottom|Left|X|Y|Horizontal|Vertical|Inline|Block)?\s*:\s*(\d+(?:\.\d+)?)\b(?!\s*[%a-z])/g;
  while ((m = js.exec(line))) {
    const n = parseFloat(m[2]);
    const set = m[1] === 'borderRadius' ? RADIUS : m[1] === 'fontSize' ? FONT_SIZE : SPACE;
    if (set !== SPACE && !CTX.zehnTokens) continue;
    if (!set.has(n)) push(m.index, m[0], 'off-scale', `Off-scale ${m[1]}: ${n}. Use the zehn scale.`);
  }
}

// ---------- native rules ----------
const scaleCheck = (set, label) => (line, push, re) => {
  let m;
  while ((m = re.exec(line))) {
    const bad = [...m[1].matchAll(/(\d+(?:\.\d+)?)/g)].map((x) => parseFloat(x[1])).filter((n) => !set.has(n));
    if (bad.length) push(m.index, m[0], 'off-scale', `Off-scale ${label}: ${bad.join(', ')}. Use ${label === 'radius' ? 'ZehnRadius' : label === 'font size' ? 'the zehn text styles' : 'ZehnSpace'}.`);
  }
};
const NATIVE = {
  swift: [
    { id: 'native-color', re: /\b(?:Color|UIColor)\.(?:system)?(?:red|blue|green|orange|yellow|pink|purple|gray|grey|black|white|cyan|mint|teal|indigo|brown|primary|secondary|accentColor)\b|(?:foregroundColor|foregroundStyle|background|tint|fill|stroke|accentColor|border)\(\s*\.(?:red|blue|green|orange|yellow|pink|purple|gray|black|white|cyan|mint|teal|indigo|brown)\b|\b(?:Color|UIColor)\(\s*(?:red:|hex:|"#|0x|#)/g,
      msg: 'System/hardcoded color. Use ZehnColor.* (tokens/native/ZehnTokens.swift).' },
    { id: 'native-weight', re: /\.fontWeight\(\s*\.(?!regular\b|semibold\b)\w+|\.bold\(\)|weight:\s*\.(?!regular\b|semibold\b)\w+/g, msg: MSG.weight },
    { id: 'native-font', re: /\.font\(\s*\.(?:system\(|largeTitle|title|title2|title3|headline|subheadline|body|callout|footnote|caption|caption2)\b|\.custom\(\s*"(?!Inter)/g,
      msg: 'Use ZehnFont (Inter) text styles, not system fonts.' },
  ],
  dart: [
    { id: 'native-color', re: /\bColors\.(?!transparent\b)\w+|\bColor\(\s*0x[0-9a-fA-F]+|\bColor\.from(?:RGBO|ARGB)\(/g,
      msg: 'Hardcoded/Material color. Use ZehnColors (tokens/native/zehn_tokens.dart).' },
    { id: 'native-weight', re: /FontWeight\.(?!w400\b|w600\b|normal\b)\w+/g, msg: MSG.weight },
    { id: 'native-font', re: /fontFamily:\s*['"](?!Inter)/g, msg: 'Only Inter: use the zehn text styles (zehn_tokens.dart).' },
  ],
  kotlin: [
    { id: 'native-color', re: /\bColor\.(?:Red|Blue|Green|Yellow|Cyan|Magenta|Gray|Grey|DarkGray|LightGray|Black|White)\b|\bColor\(\s*0x[0-9a-fA-F]+|\bColor\(\s*red\s*=/g,
      msg: 'Hardcoded color. Use ZehnLight / ZehnDark (tokens/native/ZehnTokens.kt).' },
    { id: 'native-weight', re: /FontWeight\.(?!Normal\b|SemiBold\b|W400\b|W600\b)\w+/g, msg: MSG.weight },
  ],
};
const NATIVE_SCALES = {
  swift: [[/\.padding\(\s*(?:\.[a-zA-Z]+\s*,\s*)?(\d+(?:\.\d+)?)\s*\)/g, SPACE, 'spacing'], [/\bspacing:\s*(\d+(?:\.\d+)?)/g, SPACE, 'spacing'],
    [/(?:\.cornerRadius\(|cornerRadius:\s*)(\d+(?:\.\d+)?)/g, RADIUS, 'radius'], [/\.system\(\s*size:\s*(\d+(?:\.\d+)?)/g, FONT_SIZE, 'font size']],
  dart: [[/EdgeInsets\.(?:all|symmetric|only|fromLTRB)\(([^)]*)\)/g, SPACE, 'spacing'], [/SizedBox\(\s*(?:height|width):\s*(\d+(?:\.\d+)?)/g, SPACE, 'spacing'],
    [/Radius\.circular\(\s*(\d+(?:\.\d+)?)/g, RADIUS, 'radius'], [/fontSize:\s*(\d+(?:\.\d+)?)/g, FONT_SIZE, 'font size']],
  kotlin: [[/\b(?:padding|spacedBy|Spacer\(\s*Modifier\.(?:height|width))\(([^)]*\.dp[^)]*)\)/g, SPACE, 'spacing'],
    [/RoundedCornerShape\(\s*(\d+(?:\.\d+)?)\.dp/g, RADIUS, 'radius'], [/fontSize\s*=\s*(\d+(?:\.\d+)?)\.sp/g, FONT_SIZE, 'font size']],
};

// ---------- line checker ----------
function checkLine(line, file, prev = '', ctx = contextFor(file)) {
  CTX = ctx;
  const out = [];
  if (/zehn-ignore/.test(line)) {
    if (!/zehn-ignore:\s*\S.{3,}/.test(line)) out.push({ id: 'ignore-reason', text: 'zehn-ignore', msg: MSG.ignore });
    return out;
  }
  const kind = lang(file);
  const taken = [];
  const push = (idx, text, id, msg) => {
    const end = idx + text.length;
    if (taken.some(([a, b]) => idx < b && end > a)) return; // one report per spot (no double hits like text-[#333])
    taken.push([idx, end]);
    out.push({ id, text: text.trim(), msg });
  };
  if (kind === 'web' || kind === 'css') {
    for (const r of WEB_RULES) {
      if (r.mode && r.mode !== (CTX.project ? 'project' : 'zehn')) continue;
      if (r.zehnScale && !CTX.zehnTokens) continue;
      r.re.lastIndex = 0;
      let m;
      while ((m = r.re.exec(line))) {
        if (r.ok && r.ok(line, m.index, kind, m)) continue;
        if (r.cls && !inClassContext(line, m.index, kind)) continue;
        push(m.index, m[0], r.id, typeof r.msg === 'function' ? r.msg(m) : r.msg);
      }
    }
    deadColorClasses(line, kind, push);
    importantClasses(line, push);
    if (kind === 'web' && !inComponentLibrary(file)) {
      rawPrimitives(line, push);
      if (CTX.project) duplicateComponents(line, push);
    }
    if (!/^\s*(\/\/|\*|\/\*)/.test(line)) cssPx(line, push);
  } else {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return out;
    // .font(.system(size:)) on an SF Symbol / icon image sizes the glyph, not text.
    const iconSizing = kind === 'swift' && /Image\(\s*(systemName|"|ZehnIcon)|\.imageScale/.test(prev + line);
    for (const r of NATIVE[kind]) {
      if (iconSizing && r.id === 'native-font') continue;
      r.re.lastIndex = 0;
      let m;
      while ((m = r.re.exec(line))) push(m.index, m[0], r.id, r.msg);
    }
    for (const [re, set, label] of NATIVE_SCALES[kind]) {
      if (iconSizing && label === 'font size') continue;
      re.lastIndex = 0; scaleCheck(set, label)(line, push, re);
    }
    // hex strings in native code
    const hx = /["'](#[0-9a-fA-F]{6,8})["']/g;
    let m;
    while ((m = hx.exec(line))) push(m.index, m[0], 'hex-color', typeof MSG.hex === 'function' ? MSG.hex() : MSG.hex);
  }
  return out;
}

// lines: [{n, text}]
function checkLines(lines, file) {
  const probs = [];
  const ctx = contextFor(file);
  lines.forEach(({ n, text }, i) => {
    const prev = lines.slice(Math.max(0, i - 2), i).map((l) => l.text).join('\n');
    for (const p of checkLine(text, file, prev, ctx)) probs.push({ file, line: n, ...p });
  });
  return probs;
}

function format(problems, max) {
  const out = [];
  for (const p of problems) {
    out.push(`- ${path.basename(p.file)}${p.line ? ':' + p.line : ''} \`${p.text.slice(0, 80)}\`: ${p.msg}`);
    if (out.length >= max) { out.push(`…${problems.length - max} more. Run: node "${__filename}" ${[...new Set(problems.map((x) => x.file))].join(' ')}`); break; }
  }
  return out.join('\n');
}

// ---------- changed-line detection ----------
// From a structuredPatch (Claude Code Edit/Write tool_response): '+' lines that aren't just re-indented '-' lines.
function addedFromPatch(hunks) {
  const out = [];
  for (const h of hunks) {
    const removed = new Map();
    for (const l of h.lines) if (l[0] === '-') { const k = l.slice(1).trim(); removed.set(k, (removed.get(k) || 0) + 1); }
    let n = h.newStart;
    for (const l of h.lines) {
      if (l[0] === '+') {
        const k = l.slice(1).trim();
        if (removed.get(k)) removed.set(k, removed.get(k) - 1);
        else out.push({ n, text: l.slice(1) });
        n++;
      } else if (l[0] !== '-') n++;
    }
  }
  return out;
}
// Fallback: lines of `next` whose trimmed text isn't in `prev`.
function addedFromStrings(prev, next) {
  const have = new Map();
  for (const l of (prev || '').split('\n')) { const k = l.trim(); have.set(k, (have.get(k) || 0) + 1); }
  const out = [];
  next.split('\n').forEach((l, i) => {
    const k = l.trim();
    if (have.get(k)) have.set(k, have.get(k) - 1);
    else out.push({ n: 0, text: l });
  });
  return out;
}

function changedLines(input) {
  const ti = input.tool_input || {};
  const tr = input.tool_response || {};
  if (Array.isArray(tr.structuredPatch) && tr.structuredPatch.length) return addedFromPatch(tr.structuredPatch);
  if (typeof ti.content === 'string') return addedFromStrings(tr.originalFile || '', ti.content);
  const out = [];
  if (typeof ti.new_string === 'string') out.push(...addedFromStrings(ti.old_string, ti.new_string));
  if (Array.isArray(ti.edits)) for (const e of ti.edits) if (typeof e.new_string === 'string') out.push(...addedFromStrings(e.old_string, e.new_string));
  return out;
}

function hookMode(raw) {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }
  const ti = input.tool_input || {};
  const file = ti.file_path || ti.path || '';
  if (skipped(file)) process.exit(0);
  const lines = changedLines(input);
  const problems = checkLines(lines, file);
  // A new file (Write) whose name looks like a mapped component, e.g. src/pages/StatusPill.tsx.
  const tr = input.tool_response || {};
  if (typeof ti.content === 'string' && (tr.type === 'create' || !tr.originalFile) && !problems.some((p) => p.id === 'duplicate-component')) {
    CTX = contextFor(file);
    const base = path.basename(file).replace(/\.[^.]+$/, '');
    const hit = /^[A-Z]/.test(base) && !inComponentLibrary(file) ? lookalike(base) : null;
    if (hit) problems.push({ file, line: 0, id: 'duplicate-component', text: path.basename(file), msg: dupMsg(hit) });
  }
  if (problems.length) {
    process.stderr.write(
      `zehn design system: lines you just changed in ${path.basename(file)} break the style rules. Fix these now with the project's tokens and components (zehn.project.json, else zehn's):\n` +
      format(problems, 30) +
      `\nFix each with the zehn token or component. Add ${IGNORE_FMT} ${IGNORE_SYNTAX} only when the user asked for this exact value, on every line that uses it, and list it under Design gaps. If you think no token fits, use the nearest one and list it under Design gaps; never add zehn-ignore yourself.\n`);
    process.exit(2);
  }
  const ignores = lines.filter((l) => /zehn-ignore/.test(l.text)).length;
  if (ignores) {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse',
      additionalContext: `You added ${ignores} zehn-ignore override(s) in ${path.basename(file)}. Your final message MUST list each one under "Design gaps" (what, who asked, why) so the designer sees it. Never override silently.` } }));
  }
  process.exit(0);
}

// ---------- session snapshot + stop check (git) ----------
function git(args, cwd) {
  try { return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }); } catch { return null; }
}
// Added lines vs HEAD for every changed UI file (incl. untracked). {file: [{n,text}]}
function workingAdds(cwd) {
  const root = (git(['rev-parse', '--show-toplevel'], cwd) || '').trim();
  if (!root) return null;
  const res = {};
  const diff = git(['diff', 'HEAD', '-U0', '--no-color', '--no-ext-diff'], root) ?? git(['diff', '-U0', '--no-color'], root) ?? '';
  let file = null, n = 0;
  for (const l of diff.split('\n')) {
    if (l.startsWith('+++ ')) { file = l.slice(4) === '/dev/null' ? null : path.join(root, l.slice(6)); continue; }
    if (l.startsWith('@@')) { const m = /\+(\d+)/.exec(l); n = m ? +m[1] : 0; continue; }
    if (file && l[0] === '+' && !l.startsWith('+++')) { (res[file] = res[file] || []).push({ n, text: l.slice(1) }); n++; }
  }
  for (const f of (git(['ls-files', '--others', '--exclude-standard'], root) || '').split('\n').filter(Boolean)) {
    const abs = path.join(root, f);
    if (skipped(abs)) continue;
    try {
      const st = fs.statSync(abs);
      if (st.size > 2e6) continue;
      res[abs] = fs.readFileSync(abs, 'utf8').split('\n').map((text, i) => ({ n: i + 1, text }));
    } catch {}
  }
  for (const f of Object.keys(res)) if (skipped(f)) delete res[f];
  return res;
}
const snapPath = (id) => path.join(os.tmpdir(), `zehn-design-${String(id || 'default').replace(/[^\w-]/g, '')}.json`);

function sessionStart(input) {
  const adds = workingAdds(input.cwd || process.cwd());
  if (!adds) return;
  const snap = {};
  for (const [f, ls] of Object.entries(adds)) snap[f] = ls.map((l) => l.text.trim());
  try { fs.writeFileSync(snapPath(input.session_id), JSON.stringify(snap)); } catch {}
}

function stopMode(raw) {
  let input = {};
  try { input = JSON.parse(raw); } catch {}
  if (input.stop_hook_active) process.exit(0);
  const adds = workingAdds(input.cwd || process.cwd());
  if (!adds) process.exit(0);
  let snap = {};
  try { snap = JSON.parse(fs.readFileSync(snapPath(input.session_id), 'utf8')); } catch {}
  const problems = [];
  let ignores = 0;
  for (const [f, ls] of Object.entries(adds)) {
    const before = new Map();
    for (const t of snap[f] || []) before.set(t, (before.get(t) || 0) + 1);
    const fresh = ls.filter((l) => { const k = l.text.trim(); if (before.get(k)) { before.set(k, before.get(k) - 1); return false; } return true; });
    ignores += fresh.filter((l) => /zehn-ignore/.test(l.text)).length;
    problems.push(...checkLines(fresh, f));
  }
  if (!problems.length) process.exit(0);
  process.stderr.write(
    `zehn design system: before you finish, these lines changed in this session (including through Bash or scripts) break the style rules. Fix them. Only for a value the user asked for: ${IGNORE_FMT} ${IGNORE_SYNTAX} on each line, plus a Design gaps line:\n` +
    format(problems, 30) + '\n');
  process.exit(2);
}

// ---------- main ----------
const args = process.argv.slice(2);
const readStdin = (fn) => { let raw = ''; process.stdin.on('data', (d) => (raw += d)); process.stdin.on('end', () => fn(raw)); };
if (args[0] === '--stop') readStdin(stopMode);
else if (args[0] === '--session-start') readStdin((raw) => { try { sessionStart(JSON.parse(raw)); } catch {} });
else if (args.length) {
  const all = [];
  for (const f of args) {
    if (skipped(f) || !fs.existsSync(f)) continue;
    all.push(...checkLines(fs.readFileSync(f, 'utf8').split('\n').map((text, i) => ({ n: i + 1, text })), f));
  }
  if (!all.length) { console.log('zehn style check: clean'); process.exit(0); }
  const byRule = {};
  for (const p of all) byRule[p.id] = (byRule[p.id] || 0) + 1;
  console.log(`zehn style check: ${all.length} issue(s) (${Object.entries(byRule).map(([k, v]) => `${k} ${v}`).join(', ')})\n` + format(all, 500));
  process.exit(1);
} else readStdin(hookMode);

