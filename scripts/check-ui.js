#!/usr/bin/env node
// zehn style check. Three modes:
//   Hook mode (no args): reads a PostToolUse payload (Edit/Write/MultiEdit) on stdin and checks only the lines
//     the agent actually changed (re-indented or untouched old lines are not blamed on it).
//   --session-start / --stop: snapshot uncommitted changes at session start; at stop, check every line added
//     since then (this also catches edits made through Bash or scripts).
//   CLI mode: node check-ui.js <file...>  checks whole files (used by the ui-review skill).
// Exit 2 + stderr in hook modes makes Claude Code show the violations to the agent so it fixes them.
// Gate: hook, --stop and --session-start do nothing outside zehn apps (no zehn.project.json, no --zm- tokens,
//   no project-level zehn-design plugin). CLI mode still runs and prints a one-line note.
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
function closestVar(name, known = KNOWN_VARS) {
  if (!known || !known.size) return null;
  const dist = (a, b) => {
    const d = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = d[0]; d[0] = i;
      for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; }
    }
    return d[b.length];
  };
  let best = null, bestD = Infinity;
  for (const v of known) { const x = dist(name, v); if (x < bestD) { bestD = x; best = v; } }
  return bestD <= Math.max(3, Math.floor(name.length / 4)) ? best : null;
}
const PRESET = (() => { try { return require('../tokens/tailwind.preset.cjs'); } catch { return null; } })();
// Color keys in the preset (so we can tell a real color class from one that renders nothing).
const BG_IMAGES = (() => { try { return new Set(Object.keys(PRESET.theme.extend.backgroundImage || {})); } catch { return new Set(); } })();
const COLOR_KEYS = (() => { try { return new Set(Object.keys(PRESET.theme.colors)); } catch { return null; } })();
const themeKeys = (k, dflt) => { try { return new Set(Object.keys(PRESET.theme[k]).map((x) => (x === 'DEFAULT' ? '' : x))); } catch { return new Set(dflt); } };
const ZEHN_RADIUS_KEYS = themeKeys('borderRadius', ['none', 'sm', '', 'lg', 'xl', '2xl', '3xl', '4xl', 'full']);
const ZEHN_TEXT_KEYS = themeKeys('fontSize', ['xxs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl']);
const WEIGHT_NUM = { thin: 100, hairline: 100, extralight: 200, light: 300, lighter: 300, normal: 400, regular: 400, medium: 500, semibold: 600, bold: 700, bolder: 700, extrabold: 800, black: 900 };
const ZEHN_WEIGHTS = new Set([400, 600]);
// px values a raw width/height may use: the spacing scale plus the preset's layout keys (modal 520, drawer 640…).
const LAYOUT_PX = (() => {
  const s = new Set(SPACE);
  try {
    const e = PRESET.theme.extend;
    for (const k of ['spacing', 'width', 'height', 'maxWidth', 'minWidth', 'minHeight']) for (const v of Object.values(e[k] || {})) { const m = /^(\d+(?:\.\d+)?)px$/.exec(String(v)); if (m) s.add(+m[1]); }
  } catch {}
  return s;
})();
const PLUGIN_ROOT = path.resolve(__dirname, '..');
const memo = (fn) => { const c = new Map(); return (k) => { if (!c.has(k)) c.set(k, fn(k)); return c.get(k); }; };
const readSmall = (f) => { try { const st = fs.statSync(f); return st.isFile() && st.size < 2e6 ? fs.readFileSync(f, 'utf8') : null; } catch { return null; } };
const fileText = memo(readSmall); // the checked file as it is on disk now (after the edit)
const fileLines = memo((f) => { const t = fileText(f); return t === null ? null : t.split('\n'); });

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
// Keys of `prop: { … }` blocks in a Tailwind config (text scan, no eval): borderRadius, fontSize, fontWeight.
function configKeys(text, prop) {
  const keys = new Map(); // key → first numeric value (for fontWeight)
  const re = new RegExp(`\\b${prop}\\s*:\\s*\\{`, 'g');
  let m;
  while ((m = re.exec(text))) {
    let d = 1, i = re.lastIndex;
    while (i < text.length && d) { const c = text[i]; if ('{[('.includes(c)) d++; else if ('}])'.includes(c)) d--; i++; }
    let body = text.slice(re.lastIndex, i - 1);
    const nested = /[{[(][^{}[\]()]*[}\])]/g;
    while (nested.test(body)) body = body.replace(nested, '0');
    for (const k of body.matchAll(/(?:^|,)\s*['"]?([\w.-]+)['"]?\s*:\s*['"]?(\d{3})?/g)) keys.set(k[1] === 'DEFAULT' ? '' : k[1], k[2] ? +k[2] : null);
  }
  return keys;
}
const weightOf = (v) => (/^\d{3}$/.test(String(v)) ? +v : WEIGHT_NUM[String(v)]);
function buildProject(root, j) {
  if (!j || typeof j !== 'object') return null;
  const t = j.tokens || {};
  const fb = j.fallback || {};
  const comps = j.components || {};
  const motion = j.motion || {};
  const sources = arr(t.sources).map((s) => path.resolve(root, s));
  const vars = new Set();
  const colors = new Set(['transparent', 'current', 'inherit', 'black', 'white', ...arr(t.tailwindColors)]);
  const declared = { radius: new Set(), text: new Set(), weight: new Set() };
  let cssRead = 0;
  const addConfig = (text) => {
    for (const k of configKeys(text, 'borderRadius').keys()) declared.radius.add(k);
    for (const k of configKeys(text, 'fontSize').keys()) declared.text.add(k);
    for (const [k, v] of configKeys(text, 'fontWeight')) { const n = v || weightOf(k); if (n) declared.weight.add(n); }
  };
  for (const src of sources) {
    const text = readSmall(src);
    if (text === null) continue;
    if (/\.json$/i.test(src)) {
      try { const c = JSON.parse(text); const th = c.theme || c; flattenColors(th.colors, '', colors); flattenColors(th.extend && th.extend.colors, '', colors); addConfig(text.replace(/"(\w+)"\s*:/g, '$1:')); } catch {}
      continue;
    }
    if (/\.[cm]?[jt]s$/i.test(src)) { addConfig(text); continue; }
    cssRead++;
    for (const m of text.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) {
      vars.add(m[1]);
      const c = /^--color-(.+)$/.exec(m[1]); // Tailwind v4 @theme: --color-primary → bg-primary
      if (c) colors.add(c[1]);
      const r = /^--radius(?:-(.+))?$/.exec(m[1]); if (r) declared.radius.add(r[1] || '');
      const tx = /^--text-([a-z0-9]+)$/.exec(m[1]); if (tx) declared.text.add(tx[1]);
      const w = /^--font-weight-(.+)$/.exec(m[1]); if (w && weightOf(w[1])) declared.weight.add(weightOf(w[1]));
    }
  }
  for (const cfg of ['tailwind.config.js', 'tailwind.config.cjs', 'tailwind.config.mjs', 'tailwind.config.ts']) {
    const text = readSmall(path.join(root, cfg));
    if (text) addConfig(text);
  }
  const zehnTokens = fb.zehnTokens === true;
  if (zehnTokens) {
    for (const v of KNOWN_VARS || []) vars.add(v);
    for (const c of COLOR_KEYS || []) colors.add(c);
  }
  // Allowed scales: zehn.project.json tokens.* when given, else zehn's; plus keys the app's Tailwind config / theme declares.
  const list = (x) => (Array.isArray(x) ? x.filter((v) => (typeof v === 'string' && v) || typeof v === 'number').map(String) : []);
  const radiusList = list(t.radiusKeys).map((k) => (k === 'DEFAULT' ? '' : k));
  const textList = list(t.fontSizeKeys);
  const weightList = list(t.fontWeights).map(weightOf).filter(Boolean);
  const radiusKeys = new Set([...(radiusList.length ? radiusList : ZEHN_RADIUS_KEYS), ...declared.radius]);
  const textKeys = new Set([...(textList.length ? textList : ZEHN_TEXT_KEYS), ...declared.text]);
  const weights = new Set([...(weightList.length ? weightList : ZEHN_WEIGHTS), ...declared.weight]);
  const nums = (l) => l.filter((k) => /^\d+(\.\d+)?$/.test(k)).map(Number);
  // Mapped component imports (@/components/ui/button) → their folders count as the design system too.
  const map = comps.map && typeof comps.map === 'object' ? comps.map : {};
  const importDirs = [];
  for (const e of Object.values(map)) {
    const imp = e && e.import;
    if (typeof imp !== 'string') continue;
    let p;
    if (/^[@~]\//.test(imp)) { const rest = imp.slice(2); p = [path.join(root, 'src', rest), path.join(root, rest)].find((c) => fs.existsSync(c) || fs.existsSync(path.dirname(c))) || path.join(root, 'src', rest); }
    else if (/^\.{1,2}\//.test(imp)) p = path.resolve(root, imp);
    else continue; // a package: not editable here
    let d;
    try { d = fs.statSync(p).isDirectory() ? p : path.dirname(p); } catch { d = path.dirname(p); }
    if (![root, path.join(root, 'src'), path.join(root, 'app')].includes(d) && !importDirs.includes(d)) importDirs.push(d);
  }
  const own = [comps.dir, fb.zehnDir].filter((d) => typeof d === 'string' && d.trim()).map((d) => path.resolve(root, d));
  const dirs = [...new Set([...own, ...importDirs])];
  // cssVarPrefixes: a prefix the sources already declare (--hr-) is theirs → only declared names count. A foreign prefix
  // (--radix-, set at runtime by a library) is allowed as a whole. With no readable CSS sources every prefix is allowed.
  const prefixes = arr(t.cssVarPrefixes);
  const openPrefixes = cssRead ? prefixes.filter((x) => ![...vars].some((v) => v.startsWith(x))) : prefixes;
  return {
    root, sources, vars, colors, zehnTokens, dirs, map, prefixes: openPrefixes,
    spaceKeys: arr(t.spacingKeys).length ? new Set(arr(t.spacingKeys)) : TW_SPACE_KEYS,
    radiusKeys, textKeys, weights, customWeights: weightList.length > 0,
    radiusPx: new Set([...RADIUS, ...nums(radiusList)]), fontPx: new Set([...FONT_SIZE, ...nums(textList)]),
    durations: Array.isArray(motion.durations) ? motion.durations.filter((n) => typeof n === 'number') : null,
    reducedGlobal: motion.reducedMotion === 'global',
  };
}
const ZEHN_MODE = { project: null, zehnTokens: true, colors: COLOR_KEYS, spaceKeys: TW_SPACE_KEYS, dirs: [], fileVars: new Set(),
  radiusKeys: ZEHN_RADIUS_KEYS, textKeys: ZEHN_TEXT_KEYS, weights: ZEHN_WEIGHTS, radiusPx: RADIUS, fontPx: FONT_SIZE, durations: null, reducedGlobal: false };
let CTX = ZEHN_MODE; // the context of the file being checked
let FILE = ''; // the file being checked
function contextFor(file) {
  const proj = file ? findProject(path.dirname(path.resolve(file))) : null;
  if (!proj) return ZEHN_MODE;
  const text = fileText(path.resolve(file)) || '';
  const fileVars = new Set([...text.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)].map((m) => m[1]));
  return { project: proj, zehnTokens: proj.zehnTokens, colors: proj.colors.size > 5 ? proj.colors : null, spaceKeys: proj.spaceKeys, dirs: proj.dirs, fileVars,
    radiusKeys: proj.radiusKeys, textKeys: proj.textKeys, weights: proj.weights, radiusPx: proj.radiusPx, fontPx: proj.fontPx,
    durations: proj.durations, reducedGlobal: proj.reducedGlobal };
}
function knownProjectVar(name) {
  const p = CTX.project;
  return p.vars.has(name) || CTX.fileVars.has(name) || p.prefixes.some((x) => name.startsWith(x));
}
const inside = (abs, dirs) => dirs.some((d) => abs === d || abs.startsWith(d + path.sep));

// ---------- gate: is this a zehn app at all? ----------
function existingDir(p) {
  let d = p;
  while (d && !fs.existsSync(d)) { const up = path.dirname(d); if (up === d) return null; d = up; }
  return d;
}
const gitRoot = memo((dir) => {
  if (!dir) return null;
  try { return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 }).trim() || null; } catch { return null; }
});
const LIKELY_TOKEN_FILES = ['tokens.css', 'tokens/tokens.css', 'src/tokens.css', 'src/styles/tokens.css', 'styles/tokens.css', 'src/index.css', 'src/styles/globals.css',
  'src/app/globals.css', 'app/globals.css', 'styles/globals.css', 'src/styles.css', 'tailwind.preset.cjs', 'tailwind.config.js', 'tailwind.config.cjs', 'tailwind.config.mjs', 'tailwind.config.ts'];
const GATE_CACHE = path.join(os.tmpdir(), 'zehn-design-gate.json');
const GATE_TTL = 5 * 60e3;
// A repo root is zehn when it has a zehn.project.json, enables zehn-design in its own .claude settings, depends on a zehn
// package, uses --zm- tokens in a likely token/Tailwind file, or (git grep, cached on disk) in any tracked stylesheet.
const zehnRoot = memo((root) => {
  if (!root) return false;
  if (fs.existsSync(path.join(root, PROJECT_FILE))) return true;
  for (const s of ['.claude/settings.json', '.claude/settings.local.json']) {
    const t = readSmall(path.join(root, s));
    if (t && /"zehn-design@zehn"\s*:\s*true/.test(t)) return true;
  }
  const plugin = readSmall(path.join(root, '.claude-plugin/plugin.json'));
  if (plugin && /"name"\s*:\s*"zehn-design"/.test(plugin)) return true;
  const pkg = readSmall(path.join(root, 'package.json'));
  if (pkg) {
    try { const j = JSON.parse(pkg); if (Object.keys({ ...j.dependencies, ...j.devDependencies, ...j.peerDependencies }).some((d) => /zehn/i.test(d))) return true; } catch {}
  }
  for (const f of LIKELY_TOKEN_FILES) {
    const t = readSmall(path.join(root, f));
    if (t && (/--zm-/.test(t) || (/^tailwind/.test(f) && /zehn/i.test(t)))) return true;
  }
  if (gitRoot(root) !== root) return false;
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(GATE_CACHE, 'utf8')); } catch {}
  const hit = cache[root];
  if (hit && Date.now() - hit.t < GATE_TTL) return hit.v;
  let v = false;
  try {
    execFileSync('git', ['grep', '-q', '-I', '-e', '--zm-', '--', '*.css', '*.scss', '*.sass', '*.less', '*tailwind.preset.cjs'],
      { cwd: root, stdio: 'ignore', timeout: 2000 });
    v = true;
  } catch {}
  cache[root] = { v, t: Date.now() };
  try { fs.writeFileSync(GATE_CACHE, JSON.stringify(cache)); } catch {}
  return v;
});
function gated(file, cwd) {
  const base = path.resolve(cwd || process.cwd());
  const dir = existingDir(path.dirname(path.resolve(base, file)));
  if (dir && findProject(dir)) return true;
  const root = (dir && gitRoot(dir)) || gitRoot(existingDir(base)) || base;
  return zehnRoot(root) || !!findProject(base);
}

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
  radius: () => (CTX.project && CTX.radiusKeys !== ZEHN_RADIUS_KEYS && !sameSet(CTX.radiusKeys, ZEHN_RADIUS_KEYS)
    ? `Off-scale radius class. The project's radius keys: ${[...CTX.radiusKeys].map((k) => (k ? `rounded-${k}` : 'rounded')).join(' ')}.`
    : 'Off-scale or unknown radius. Pick by element: rounded (4) cards, panels, tables, banners, toasts, badges, small buttons · rounded-lg (8) buttons, inputs, menus · rounded-xl (12) modals · rounded-2xl (16) mobile cards · rounded-full avatars, counters, switches.'),
  shadow: 'Default Tailwind shadow renders nothing under the zehn preset. Web cards: a 1px border-border-default, no shadow. shadow-100 raised controls · shadow-200 tooltips, toasts · shadow-300 menus, modals, drawers · shadow-focus.',
  textSize: () => (CTX.project && !sameSet(CTX.textKeys, ZEHN_TEXT_KEYS)
    ? `Off-scale text size. The project's sizes: ${[...CTX.textKeys].map((k) => `text-${k}`).join(' ')}.`
    : 'No such text size. App UI: text-xs 12 meta · text-sm 14 body · text-base 16 · text-lg 18 · text-2xl 24 H1. text-3xl…7xl are for mobile large titles and marketing pages only.'),
  weight: 'Only 400 and 600 exist: 300/500 → font-normal, 700/bold → font-semibold.',
  weightFn: () => (CTX.project && !sameSet(CTX.weights, ZEHN_WEIGHTS) ? `Off-scale font weight. The project's weights: ${[...CTX.weights].join(' ')}.` : MSG.weight),
  gradient: () => (CTX.project ? 'Gradients are off-system. Use a flat color token from the project.' : 'Gradients are off-system: zehn ships none. Use a flat surface token; AI surfaces are flat bg-ai-bg or the ai-* variants.'),
  pill: () => (CTX.project ? 'Pill buttons/inputs are off-system: use the project\'s button/input radius.' : 'Pill buttons/inputs are off-system: buttons and inputs use 8px corners (rounded-lg).'),
  dsEdit: (dir) => `You changed the shared design system (${dir}). That's allowed when the user asked for it or when you build a missing catalog component there; list it under Design gaps as "design-system change, designer sign-off needed". Never restyle a shared component for one screen.`,
  transitionAll: 'Name the properties (transition-colors, transition-opacity, transition-transform); transition: all animates layout and color by accident.',
  slow: (ms) => (CTX.durations
    ? `${ms}ms isn't one of the project's durations (zehn.project.json motion.durations: ${CTX.durations.join(' ')}ms).`
    : `${ms}ms is too slow for product UI. zehn motion tokens: 150ms hover/press (duration-fast), 200ms menus/modals/toasts (duration-base), 300ms drawers/panels (duration-slow).`),
  numericDuration: 'Numeric duration classes render nothing under the zehn preset. Use duration-fast (150ms hover/press), duration-base (200ms menus/modals/toasts) or duration-slow (300ms drawers/panels).',
  arbDuration: () => (CTX.project && !CTX.zehnTokens ? 'Arbitrary duration. Use the project\'s duration classes or tokens.' : 'Arbitrary duration. Use duration-fast (150ms hover/press), duration-base (200ms menus/modals/toasts) or duration-slow (300ms drawers/panels).'),
  layoutAnim: 'Animating layout (width/height/top/left/margin/padding) reflows every frame. Animate transform and opacity only; for size changes use the layout prop or a transform.',
  bounce: 'No bouncy motion in product UI. Use ease-out (ease-out / --zm-ease-out), no bounce or ping.',
  scale0: 'Start at scale 0.95-0.97 with opacity 0, never from 0.',
  reducedCss: 'Animation/transition without a reduced-motion path. Use the --zm-duration-* vars (they drop to 0ms) or add @media (prefers-reduced-motion: reduce).',
  reducedJs: 'Add a reduced-motion path (useReducedMotion or <MotionConfig reducedMotion="user"> at the app root).',
  family: 'Only Inter: remove the font-family; it inherits var(--zm-font-sans). For aligned numbers use tabular-nums.',
  unknownProjectVar: (name) => {
    const near = closestVar(name, new Set([...CTX.project.vars, ...CTX.fileVars]));
    return `Unknown token: ${name} isn't declared in ${PROJECT_REF}.${near ? ` Did you mean ${near}?` : ''} Use an existing token.`;
  },
  unknownVar: (name) => `Unknown zehn token: ${name} does not exist.${closestVar(name) ? ` Did you mean ${closestVar(name)}?` : ''} See ${REF}.`,
  ignore: `zehn-ignore needs who asked and why: ${IGNORE_FMT}, and a Design gaps line.`,
};

function sameSet(a, b) { if (a === b) return true; if (a.size !== b.size) return false; for (const x of a) if (!b.has(x)) return false; return true; }

const SINGLE_WORD_UTILS = new Set('flex grid block inline inline-block inline-flex inline-grid hidden contents table relative absolute fixed sticky static truncate underline uppercase lowercase capitalize italic rounded border shadow grow shrink container ring outline transition invisible visible isolate group peer sr-only antialiased overflow-hidden'.split(' '));
// A lone token in quotes ('p-101', 'm-2') is an id or a key as often as a class; count it only with a variant (md:p-4)
// or when the line names classes/styles.
const CLASS_HINT = /class|cls\b|styles?\b|variants?\b|\btw\b|size/i;
function quotedSegment(line, idx) {
  // The quoted string ('', "", ``) that contains position idx, or null.
  const re = /(["'`])((?:\\.|(?!\1).)*)\1/g;
  let m;
  while ((m = re.exec(line))) if (m.index < idx && idx < m.index + m[0].length) return m[2];
  return null;
}
function classLike(s, line = '') {
  const toks = s.trim().split(/\s+/).filter(Boolean);
  if (!toks.length) return false;
  if (toks.length === 1 && !/:/.test(toks[0]) && !CLASS_HINT.test(line)) return false;
  return toks.every((t) => /[-:[]/.test(t) ? /^[!\-]?[\w:[\]()/.\-%#,'=&>~*@]+$/.test(t) : SINGLE_WORD_UTILS.has(t)) && toks.some((t) => /-/.test(t));
}
const CLASS_CTX = /\bclass(Name)?\s*=|:class=|\b(cn|clsx|cx|cva|twMerge|twJoin|classNames|classnames)\(|\btw`|@apply|classList/;
function inClassContext(line, idx, kind) {
  if (kind === 'css') return /@apply/.test(line);
  const seg = quotedSegment(line, idx);
  if (seg === null) return /@apply/.test(line);
  return CLASS_CTX.test(line) || classLike(seg, line);
}
const AI_GRADIENT = /ai-gradient|--zm-ai\b|--zm-ai-|variant=["'{`]*ai-|\b(?:from|via|to|bg|text)-ai(?:-bg)?\b/;
const tokenFile = () => /token/i.test(path.basename(FILE));
const PILL_EL = /<(?:button|Button|input|Input|select|Select|textarea|Textarea)\b|\bonClick=|role=["']button/;

const WEB_RULES = [
  { id: 'gradient', msg: MSG.gradient, cls: true,
    re: new RegExp(`(?<![\\w-])${V}(?:bg-(?:gradient|linear|radial|conic)-[\\w[\\]().,%/-]+|(?:from|via|to)-(?!\\d+%)(?:[a-z][\\w-]*|\\[[^\\]]+\\])(?:\\/\\d+)?)(?![\\w-])`, 'g'),
    ok: (line) => AI_GRADIENT.test(line) || tokenFile() },
  { id: 'gradient', msg: MSG.gradient, re: /\b(?:repeating-)?(?:linear|radial|conic)-gradient\(/g,
    ok: (line) => /^\s*(\/\/|\*|\/\*)/.test(line) || AI_GRADIENT.test(line) || tokenFile() },
  { id: 'pill', msg: MSG.pill, cls: true, re: new RegExp(`(?<![\\w-])${V}rounded-full(?![\\w-])`, 'g'), ok: (line) => !PILL_EL.test(line) },
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
  // Radius, text size and weight run in every mode: the allowed keys are zehn's, or the project's (tokens.radiusKeys /
  // fontSizeKeys / fontWeights, plus keys its Tailwind config or theme sources declare).
  { id: 'tracking', zehnScale: true, msg: 'zehn sets the -1% letter spacing in the preset; remove tracking-*.', cls: true,
    re: new RegExp(`(?<![\\w-])${V}tracking-(?:tighter|tight|normal|wide|wider|widest)(?![\\w-])`, 'g') },
  { id: 'div-click', msg: 'Clickable things are a <button> (the project\'s Button or IconButton) or a link, never a <div>/<span> with onClick: those aren\'t keyboard-reachable.',
    re: /<(?:div|span|li|img)\b(?=[^>]*\bonClick=)(?![^>]*\brole=)[^>]*/g,
    // a scrim behind a dialog, a click-catcher that only stops propagation, a label that mirrors a real control
    ok: (line) => /aria-hidden|stopPropagation|\bid=\{?["'`]?\w*[lL]abel/.test(line) },
  { id: 'radius', msg: MSG.radius, cls: true,
    re: new RegExp(`(?<![\\w-])${V}rounded(?:-(?:t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee))?(?:-([a-z0-9.]+))?(?![\\w-])`, 'g'),
    ok: (line, i, kind, m) => CTX.radiusKeys.has(m[1] || '') },
  { id: 'shadow', zehnScale: true, msg: MSG.shadow, cls: true,
    re: new RegExp(`(?<![\\w-])${V}shadow(?:-(?:sm|md|lg|xl|2xl|inner))?(?![\\w-])`, 'g'),
    ok: (line, i) => /^\s*(\/\/|\*)/.test(line) },
  { id: 'text-size', msg: MSG.textSize, cls: true, re: new RegExp(`(?<![\\w-])${V}text-(xxs|xs|sm|md|base|lg|xl|[2-9]xl|tiny)(?![\\w-])`, 'g'),
    ok: (line, i, kind, m) => CTX.textKeys.has(m[1]) },
  { id: 'font-weight', msg: MSG.weightFn,
    re: /(?<![\w-])font-weight\s*:\s*['"]?([a-z]+|\d{3})\b|\bfontWeight\s*:\s*['"]?([a-z]+|\d{3})\b/g,
    ok: (line, i, kind, m) => { const n = weightOf(m[1] || m[2]); return !n || CTX.weights.has(n); } },
  { id: 'font-weight-class', msg: MSG.weightFn, cls: true,
    re: new RegExp(`(?<![\\w-])${V}font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)(?![\\w-])`, 'g'),
    ok: (line, i, kind, m) => CTX.weights.has(WEIGHT_NUM[m[1]]) },
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
    if (base === 'bg' && BG_IMAGES.has(val)) continue;
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
    if (!classLike(m[2], line) && !CLASS_CTX.test(line)) continue;
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
// Inside the shared folder, raw elements belong only to the components that wrap them (Button.tsx, Input.tsx, the
// zehn components, the mapped ones). A new shared component builds on those, so moving markup there doesn't dodge the check.
const ZEHN_SHIPPED = (() => { try { return new Set(fs.readdirSync(path.join(PLUGIN_ROOT, 'components/react')).map((f) => f.replace(/\.[^.]+$/, '').toLowerCase())); } catch { return new Set(); } })();
const PRIMITIVE_OWNER = /^(button|icon-?button|input|text-?input|textarea|select|checkbox|radio|radio-?group|switch|toggle|field|form-?field|dialog|modal|alert-?dialog|drawer|sheet|menu|dropdown(-?menu)?|popover|tooltip|segmented-?control|tabs?|toast|pager|pagination|data-?table|table|toolbar|filter-?chips?|top-?bar|nav)$/i;
function primitiveOwner(file) {
  const abs = path.resolve(file);
  if (abs.startsWith(PLUGIN_ROOT + path.sep)) return true;
  const base = path.basename(abs).replace(/\.[^.]+$/, '');
  if (base.toLowerCase() === 'index') return true;
  if (PRIMITIVE_OWNER.test(base) || ZEHN_SHIPPED.has(base.toLowerCase())) return true;
  const map = (CTX.project && CTX.project.map) || {};
  return Object.values(map).some((e) => e && ((e.import && path.basename(String(e.import)).toLowerCase() === base.toLowerCase()) || String(e.component || '').toLowerCase() === base.toLowerCase()));
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

// Restyling a component through className: <Button className="bg-… rounded-full">. Visual classes fight the
// component's own (cx doesn't merge Tailwind classes) and fork its look. Layout classes (margin, width, flex) are fine.
const STYLED = ['Button', 'IconButton', 'Badge', 'Input', 'Select', 'Textarea', 'Avatar', 'Counter', 'Checkbox', 'Radio', 'Switch', 'Tooltip', 'SegmentedControl'];
const VISUAL_CLASS = new RegExp(`(?<![\\w-])${V}(?:bg-(?!clip|origin|fixed|local|scroll|repeat|no-repeat|cover|contain|center)[\\w-]+|text-(?!left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)[\\w-]+|border-(?!0\\b|x\\b|y\\b)[a-z][\\w-]*|rounded(?:-[\\w-]+)?|shadow(?:-[\\w-]+)?|font-[\\w-]+|ring-[a-z][\\w-]*|p[xytrbl]?-[\\d.]+|h-[\\d.]+|opacity-\\d+)(?![\\w-])`, 'g');
function restyledComponents(line, push) {
  const names = new Set(STYLED);
  if (CTX.project) for (const e of Object.values(CTX.project.map || {})) if (e && e.component) names.add(String(e.component));
  const re = /<([A-Z][\w.]*)\b[^>]*?\bclassName=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{\s*(?:cx|cn|clsx)\(([^)]*)\))/g;
  let m;
  while ((m = re.exec(line))) {
    const name = m[1].split('.').pop();
    if (!names.has(name)) continue;
    const cls = m[2] || m[3] || m[4] || m[5] || '';
    // round IconButtons and avatars are on-system
    const hits = (cls.match(VISUAL_CLASS) || []).filter((c) => !(/(?:^|:)rounded-full$/.test(c) && /^(IconButton|Avatar)$/.test(name)));
    if (!hits.length) continue;
    push(m.index, `<${name} className="${hits.join(' ')}"`, 'restyled-component',
      `Don't restyle ${name} through className: visual classes fight the component's own and fork its look. Pick a variant or size; if none fits, it's a gap (or a new variant in the shared component, with sign-off). Layout classes (margin, width, flex, grid) are fine.`);
  }
}

// Project mode: a new component outside the design-system folders that duplicates a mapped one. It fires only when
// the new component renders the raw element the mapped one covers (PrimaryButton → <button>, styled.button), or when
// its name ends with a mapped name/synonym and it's exported from a shared/ui-like folder. Compositions and sub-parts
// (RequestsTableSkeleton, CardTop, Header…) never count.
const SYNONYMS = { Badge: ['Pill', 'Tag', 'Chip'], Modal: ['Dialog', 'Popup'], AlertDialog: ['Confirm'], Drawer: ['Sheet', 'SidePanel'],
  Toast: ['Snackbar', 'Notification'], Button: ['Btn'], Select: ['Dropdown'], Tooltip: ['Hint'], Input: ['TextField'], Avatar: ['UserPic'] };
const NOT_COMPONENT = /(Context|Props|Provider|Group|Store|Type|Types|State|Ref|Schema|Variants|Styles|Config)$/;
const PART_SUFFIX = /(Skeleton|Placeholder|Loading|Layout|Section|Row|Cell|Header|Footer|Body|Top|Bottom|Wrapper|Container|Root|Inner|Item|Icon)$/;
const RAW_FOR = {
  Button: /<button\b|styled\.button\b|styled\(\s*['"]button/, Select: /<select\b|styled\.select\b/, Textarea: /<textarea\b|styled\.textarea\b/,
  Input: /<input\b(?![^>]*type=["'](?:checkbox|radio))|styled\.input\b/, Checkbox: /type=["']checkbox/, Radio: /type=["']radio/,
  Switch: /role=["']switch/, Modal: /<dialog\b|role=["']dialog/, AlertDialog: /role=["']alertdialog|<dialog\b/, Tooltip: /role=["']tooltip/,
  Menu: /role=["']menu["']/, Tabs: /role=["']tablist/,
};
const SHARED_DIR = /(^|\/)(shared|ui|common|primitives|design-system|kit|elements|base)\//i;
const words = (n) => n.match(/[A-Z][a-z0-9]*/g) || [n];
function lookalike(name, { body = '', exported = false, file = FILE } = {}) {
  if (!CTX.project || NOT_COMPONENT.test(name) || PART_SUFFIX.test(name)) return null;
  const w = words(name);
  const rel = path.relative(CTX.project.root, path.resolve(file)).split(path.sep).join('/');
  for (const [catalog, e] of Object.entries(CTX.project.map)) {
    if (e && e.component === name) return null; // their own component (a re-export or wrapper of the same name)
    const names = [catalog, e && e.component, ...(SYNONYMS[catalog] || [])].filter((x) => typeof x === 'string' && /^[A-Z]/.test(x));
    for (const n of names) {
      const nw = words(n);
      let at = -1;
      for (let i = 0; i + nw.length <= w.length; i++) if (nw.every((x, k) => w[i + k] === x)) at = i;
      if (at < 0) continue;
      const raw = RAW_FOR[catalog] || (e && RAW_FOR[e.component]);
      if (raw && raw.test(body)) return { catalog, entry: e || {} };
      if (at + nw.length === w.length && exported && SHARED_DIR.test(rel)) return { catalog, entry: e || {} };
    }
  }
  return null;
}
const dupMsg = (hit) => `Looks like a new ${hit.catalog}. Use ${hit.entry.component || hit.catalog}${hit.entry.import ? ` from ${hit.entry.import}` : ''}; if it can't do this, extend it there and list it as a design gap.`;
const COMPONENT_DEF = /(?:^|[^\w.])(export\s+(?:default\s+)?)?(?:function\s+([A-Z]\w*)\s*[(<]|(?:const|let)\s+([A-Z]\w*)\s*(?::[^=]+)?=\s*(?:React\.)?(?:\(|forwardRef|memo|styled|function|async\s*\()|class\s+([A-Z]\w*)\s+extends)/g;
// The definition's source: from its line in the file on disk (else the changed lines) to the next definition, ≤40 lines.
function bodyFrom(lines, i, file) {
  const fl = fileLines(path.resolve(file));
  const n = lines[i].n;
  const seq = fl && n > 0 && fl[n - 1] !== undefined && fl[n - 1].trim() === lines[i].text.trim()
    ? fl.slice(n - 1, n + 39) : lines.slice(i, i + 40).map((l) => l.text);
  const out = [seq[0]];
  for (let k = 1; k < seq.length; k++) { COMPONENT_DEF.lastIndex = 0; if (COMPONENT_DEF.test(seq[k])) break; out.push(seq[k]); }
  return out.join('\n');
}
function duplicateComponents(lines, i, file, push) {
  const line = lines[i].text;
  if (/^\s*(\/\/|\*|\/\*)/.test(line) || /zehn-ignore/.test(line)) return;
  COMPONENT_DEF.lastIndex = 0;
  let m, body = null;
  while ((m = COMPONENT_DEF.exec(line))) {
    const name = m[2] || m[3] || m[4];
    if (body === null) body = bodyFrom(lines, i, file);
    const hit = lookalike(name, { body, exported: !!m[1], file });
    if (hit) push(m.index, name, 'duplicate-component', dupMsg(hit));
    COMPONENT_DEF.lastIndex = m.index + m[0].length;
  }
}

const offScaleHint = (kind) => (CTX.project && !CTX.zehnTokens ? 'Use the project\'s tokens (zehn.project.json tokens.sources).'
  : kind === 'size' ? 'Use a zehn layout size (max-w-column-narrow, w-modal, w-drawer, h-row…), 100%, auto or a token.'
    : 'Use var(--zm-space-*), var(--zm-radius-*) or a text style.');
// Raw px in CSS (and CSS-in-JS / styled-components template lines).
function cssPx(line, push, kind, back) {
  const re = /(?<![\w-])(padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left|border-radius|font-size|(?:min-|max-)?(?:width|height))(?:-[a-z]+)?\s*:\s*([^;}{]+)/g;
  let m;
  // width/height in JS/TSX only where it's clearly styling (style={{}}, sx, styled/css template lines), not data like column widths.
  const sizeOk = kind === 'css' || /\bstyle\b|\bsx\b|\bcss\b|styled/.test(line) || /^\s*(?:min-|max-)?(?:width|height)\s*:\s*[^;'"`]+;\s*$/.test(line);
  while ((m = re.exec(line))) {
    const prop = m[1];
    const size = /width|height/.test(prop);
    if (size && !sizeOk) continue;
    const nums = [...m[2].matchAll(/(-?\d+(?:\.\d+)?)px/g)].map((x) => Math.abs(parseFloat(x[1])));
    const set = prop === 'border-radius' ? CTX.radiusPx : prop === 'font-size' ? CTX.fontPx : size ? LAYOUT_PX : SPACE;
    if (prop === 'border-radius' && /(?:\d{3,}px|50%|100%)/.test(m[2]) && /button|btn|input|select|textarea/i.test(back())) {
      push(m.index, m[0].trim(), 'pill', MSG.pill()); continue;
    }
    const bad = nums.filter((n) => !set.has(n));
    if (bad.length) push(m.index, m[0].trim(), 'off-scale', `Off-scale ${prop}: ${bad.join('px, ')}px. ${offScaleHint(size ? 'size' : '')}`);
  }
  const js = /\b(padding|margin|gap|rowGap|columnGap|fontSize|borderRadius)(?:Top|Right|Bottom|Left|X|Y|Horizontal|Vertical|Inline|Block)?\s*:\s*(\d+(?:\.\d+)?)\b(?!\s*[%a-z])/g;
  while ((m = js.exec(line))) {
    const n = parseFloat(m[2]);
    const set = m[1] === 'borderRadius' ? CTX.radiusPx : m[1] === 'fontSize' ? CTX.fontPx : SPACE;
    if (!set.has(n)) push(m.index, m[0], 'off-scale', `Off-scale ${m[1]}: ${n}. ${CTX.project && !CTX.zehnTokens ? 'Use the project\'s scale.' : 'Use the zehn scale.'}`);
  }
}

// ---------- motion ----------
const MOTION_EXEMPT = /spin|loader|spinner|shimmer|skeleton|marquee|progress|repeat:\s*Infinity|infinite/i;
const FRAMER_IMPORT = /from\s+['"](?:framer-motion|motion\/react(?:-client)?|motion)['"]|require\(\s*['"]framer-motion['"]\)/;
const LAYOUT_PROPS = /^(width|height|top|left|right|bottom|inset|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|max-height|max-width|min-height|min-width|margin[A-Z]\w*|padding[A-Z]\w*|maxHeight|maxWidth|minHeight|minWidth)$/;
const tooSlow = (ms) => (CTX.durations ? ms !== 0 && !CTX.durations.includes(ms) : ms > 300);
function motionRules(line, kind, push) {
  if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
  const exempt = MOTION_EXEMPT.test(line);
  const cls = (re, fn) => { re.lastIndex = 0; let m; while ((m = re.exec(line))) if (inClassContext(line, m.index, kind)) fn(m); };
  const any = (re, fn) => { re.lastIndex = 0; let m; while ((m = re.exec(line))) fn(m); };
  const framerFile = FRAMER_IMPORT.test(fileText(path.resolve(FILE)) || '');
  // a. transition: all
  cls(new RegExp(`(?<![\\w-])${V}transition-all(?![\\w-])`, 'g'), (m) => push(m.index, m[0], 'transition-all', MSG.transitionAll));
  any(/(?<![\w-])transition(?:-property)?\s*:\s*['"`]?\s*all\b|\btransitionProperty\s*:\s*['"`]all\b/g, (m) => push(m.index, m[0], 'transition-all', MSG.transitionAll));
  // b. durations
  if (!exempt) {
    cls(new RegExp(`(?<![\\w-])${V}duration-(\\d+)(?![\\w-])`, 'g'), (m) => {
      const ms = +m[1];
      if (tooSlow(ms)) push(m.index, m[0], 'slow-motion', MSG.slow(ms));
      else if (ms !== 0 && CTX.zehnTokens) push(m.index, m[0], 'duration-token', MSG.numericDuration);
    });
    cls(new RegExp(`(?<![\\w-])${V}duration-\\[([^\\]]+)\\]`, 'g'), (m) => {
      if (/^var\(--zm-duration-/.test(m[1]) || (CTX.project && /^var\(--/.test(m[1]))) return;
      push(m.index, m[0], 'duration-token', MSG.arbDuration());
    });
    any(/(?<![\w-])(transition|transition-duration|animation|animation-duration|transitionDuration|animationDuration)\s*:\s*([^;{}]+)/g, (m) => {
      const slow = [...m[2].matchAll(/(?<![\w.-])(\d*\.?\d+)(ms|s)(?![\w-])/g)].map((t) => Math.round(parseFloat(t[1]) * (t[2] === 's' ? 1000 : 1))).filter(tooSlow);
      if (slow.length) push(m.index, m[0].trim(), 'slow-motion', MSG.slow(Math.max(...slow)));
    });
    // Framer Motion: duration in seconds inside a transition object.
    if (kind === 'web' && (framerFile || /transition|animate|initial|exit|while[A-Z]/.test(line))) {
      any(/\bduration\s*:\s*(\d*\.?\d+)(?!\s*(?:m?s\b|['"`\w%.]))/g, (m) => {
        const v = parseFloat(m[1]);
        if (v >= 10) return; // ms values belong to other APIs (toast timeouts…)
        const ms = Math.round(v * 1000);
        if (tooSlow(ms)) push(m.index, m[0], 'slow-motion', MSG.slow(ms));
      });
    }
  }
  // c. layout properties
  any(/(?<![\w-])(?:transition|transition-property|transitionProperty)\s*:\s*([^;{}]+)/g, (m) => {
    const props = m[1].replace(/['"`]/g, '').split(',').map((s) => s.trim().split(/\s+/)[0]);
    if (props.some((p) => LAYOUT_PROPS.test(p))) push(m.index, m[0].trim(), 'layout-animation', MSG.layoutAnim);
  });
  cls(new RegExp(`(?<![\\w-])${V}transition-\\[([^\\]]+)\\]`, 'g'), (m) => {
    if (m[1].split(',').some((p) => LAYOUT_PROPS.test(p.trim()))) push(m.index, m[0], 'layout-animation', MSG.layoutAnim);
  });
  if (kind === 'web' && !/\slayout(?=[\s/>={])/.test(line)) {
    any(/\b(?:animate|exit)=\{\{[^}]*?\b(height|width|top|left|right|bottom|margin\w*|padding\w*|maxHeight|minHeight|maxWidth|minWidth)\s*:/g,
      (m) => push(m.index, m[0], 'layout-animation', MSG.layoutAnim));
  }
  // d. bounce
  cls(new RegExp(`(?<![\\w-])${V}animate-(?:bounce|ping)(?![\\w-])`, 'g'), (m) => push(m.index, m[0], 'bounce', MSG.bounce));
  any(/\bbounce\s*:\s*(\d*\.?\d+)/g, (m) => { if (parseFloat(m[1]) > 0.3) push(m.index, m[0], 'bounce', MSG.bounce); });
  // e. enter from scale 0
  if (!exempt) {
    cls(new RegExp(`(?<![\\w-])${V}-?scale(?:-[xy])?-0(?![\\w.%/-])`, 'g'), (m) => push(m.index, m[0], 'scale-zero', MSG.scale0));
    any(/\bscale(?:3d|X|Y)?\(\s*0\s*[,)]/g, (m) => push(m.index, m[0], 'scale-zero', MSG.scale0));
    if (kind === 'css') any(/(?<![\w-])scale\s*:\s*0(?![.\d\w])/g, (m) => push(m.index, m[0], 'scale-zero', MSG.scale0));
    else if (framerFile || /\b(?:initial|exit|animate)=/.test(line)) any(/\bscale\s*:\s*0(?![.\d\w])/g, (m) => push(m.index, m[0], 'scale-zero', MSG.scale0));
  }
}
// f. reduced motion: one flag per file whose changed lines add motion with no reduced-motion path.
function reducedMotion(lines, file) {
  const kind = lang(file);
  const live = lines.filter((l) => !/zehn-ignore/.test(l.text) && !/^\s*(\/\/|\*|\/\*)/.test(l.text));
  const text = fileText(path.resolve(file));
  const all = text === null ? lines.map((l) => l.text).join('\n') : text;
  if (kind === 'css') {
    const hit = live.find((l) => /@keyframes|(?<![\w-])animation(?:-name)?\s*:(?!\s*none)|(?<![\w-])transition\s*:(?!\s*none)/.test(l.text));
    if (hit && !/prefers-reduced-motion/.test(all) && !/--zm-duration-/.test(all)) return { line: hit.n, text: hit.text, msg: MSG.reducedCss };
  } else if (kind === 'web' && /\.(tsx|jsx|ts|js|mjs)$/i.test(file) && !CTX.reducedGlobal && FRAMER_IMPORT.test(all)) {
    const hit = live.find((l) => /<motion\.|\bmotion\(|\buseAnimate\b|(?<![\w.])animate\(/.test(l.text));
    if (hit && !/useReducedMotion|MotionConfig/.test(all)) return { line: hit.n, text: hit.text, msg: MSG.reducedJs };
  }
  return null;
}

// ---------- design-system folders ----------
// Editing the shared components restyles every screen: one flag per file (hook / stop only). The plugin's own
// components/react is exempt when the repo is the plugin itself.
const pluginRepo = memo((dir) => {
  for (let d = dir; ; d = path.dirname(d)) {
    const t = readSmall(path.join(d, '.claude-plugin/plugin.json'));
    if (t) return /"name"\s*:\s*"zehn-design"/.test(t);
    if (path.dirname(d) === d) return false;
  }
});
function designSystemDir(file) {
  const abs = path.resolve(file);
  const dir = existingDir(path.dirname(abs));
  if (!dir || abs.startsWith(PLUGIN_ROOT + path.sep) || pluginRepo(dir)) return null;
  const proj = findProject(dir);
  const rootOf = (d) => path.relative(proj ? proj.root : gitRoot(dir) || dir, d).split(path.sep).join('/') || '.';
  if (proj) { const d = proj.dirs.find((x) => inside(abs, [x])); if (d) return rootOf(d); }
  const z = /^(.*[\\/]components[\\/]zehn)[\\/]/.exec(abs);
  return z ? rootOf(z[1]) : null;
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
function checkLine(line, file, prev = '', ctx = contextFor(file), back = () => prev) {
  CTX = ctx;
  FILE = file;
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
    if (id === 'gradient' && out.some((p) => p.id === id)) return; // bg-gradient-to-r from-x to-y is one gradient
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
    if (kind === 'web' && (!inComponentLibrary(file) || !primitiveOwner(file))) rawPrimitives(line, push);
    if (kind === 'web' && !inComponentLibrary(file)) restyledComponents(line, push);
    if (!/^\s*(\/\/|\*|\/\*)/.test(line)) cssPx(line, push, kind, back);
    motionRules(line, kind, push);
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

// lines: [{n, text}]. opts.changed: these are lines the agent changed (hook / stop), not a whole-file review.
function checkLines(lines, file, opts = {}) {
  const probs = [];
  const ctx = contextFor(file);
  const kind = lang(file);
  lines.forEach(({ n, text }, i) => {
    const prev = lines.slice(Math.max(0, i - 2), i).map((l) => l.text).join('\n');
    // The CSS rule / styled block this line sits in (for selector-aware rules like pill buttons).
    const back = () => {
      const fl = fileLines(path.resolve(file));
      const before = fl && n > 0 ? fl.slice(Math.max(0, n - 16), n - 1) : prev.split('\n');
      for (let k = before.length - 1; k >= 0; k--) if (/\{\s*$|styled|css`/.test(before[k])) return before[k];
      return prev;
    };
    for (const p of checkLine(text, file, prev, ctx, back)) probs.push({ file, line: n, ...p });
    if (kind === 'web' && ctx.project && !inComponentLibrary(file)) {
      duplicateComponents(lines, i, file, (idx, t, id, msg) => {
        if (!probs.some((p) => p.line === n && p.id === id && p.text === t)) probs.push({ file, line: n, id, text: t, msg });
      });
    }
  });
  CTX = ctx; FILE = file;
  if (kind === 'web' || kind === 'css') {
    const rm = reducedMotion(lines, file);
    if (rm) probs.push({ file, line: rm.line, id: 'reduced-motion', text: rm.text.trim(), msg: rm.msg });
  }
  if (opts.changed) {
    const ds = designSystemDir(file);
    const hit = ds && lines.find((l) => l.text.trim() && !/zehn-ignore/.test(l.text));
    if (hit) probs.unshift({ file, line: hit.n, id: 'design-system-edit', text: ds, msg: MSG.dsEdit(ds) });
  }
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
  const rawFile = ti.file_path || ti.path || '';
  const file = rawFile && input.cwd ? path.resolve(input.cwd, rawFile) : rawFile;
  if (skipped(file)) process.exit(0);
  if (!gated(file, input.cwd)) process.exit(0); // not a zehn app: stay silent
  const lines = changedLines(input);
  const problems = checkLines(lines, file, { changed: true });
  // A new file (Write) whose name looks like a mapped component, e.g. src/shared/ui/StatusPill.tsx.
  const tr = input.tool_response || {};
  if (typeof ti.content === 'string' && (tr.type === 'create' || !tr.originalFile) && !problems.some((p) => p.id === 'duplicate-component')) {
    CTX = contextFor(file); FILE = file;
    const base = path.basename(file).replace(/\.[^.]+$/, '');
    const hit = /^[A-Z]/.test(base) && lang(file) === 'web' && !inComponentLibrary(file)
      ? lookalike(base, { body: ti.content, exported: /\bexport\b/.test(ti.content), file }) : null;
    if (hit) problems.push({ file, line: 0, id: 'duplicate-component', text: path.basename(file), msg: dupMsg(hit) });
  }
  // The design-system note informs; it never blocks (building a missing component there is allowed).
  const notes = problems.filter((p) => p.id === 'design-system-edit');
  const errors = problems.filter((p) => p.id !== 'design-system-edit');
  const noteText = notes.length && firstNotice(input.session_id, file) ? `zehn design system: ${notes[0].msg}` : '';
  if (errors.length) {
    process.stderr.write((noteText ? noteText + '\n\n' : '') +
      `zehn design system: lines you just changed in ${path.basename(file)} break the style rules. Fix these now with the project's tokens and components (zehn.project.json, else zehn's):\n` +
      format(errors, 30) +
      `\nFix each with the zehn token or component. Add ${IGNORE_FMT} ${IGNORE_SYNTAX} only when the user asked for this exact value, on every line that uses it, and list it under Design gaps. If you think no token fits, use the nearest one and list it under Design gaps; never add zehn-ignore yourself.\n`);
    process.exit(2);
  }
  const ignores = lines.filter((l) => /zehn-ignore/.test(l.text)).length;
  const ctxText = [noteText, ignores ? `You added ${ignores} zehn-ignore override(s) in ${path.basename(file)}. Your final message MUST list each one under "Design gaps" (what, who asked, why) so the designer sees it. Never override silently.` : ''].filter(Boolean).join('\n');
  if (ctxText) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: ctxText } }));
  process.exit(0);
}

// Show the design-system note once per file per session.
function firstNotice(session, file) {
  const f = path.join(os.tmpdir(), `zehn-design-notes-${String(session || 'default').replace(/[^\w-]/g, '')}.json`);
  let seen = [];
  try { seen = JSON.parse(fs.readFileSync(f, 'utf8')); } catch {}
  if (seen.includes(file)) return false;
  try { fs.writeFileSync(f, JSON.stringify([...seen, file])); } catch {}
  return true;
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

// Is the session's repo (or any package in it) a zehn app?
function repoGated(cwd) {
  const root = gitRoot(existingDir(path.resolve(cwd)));
  if (zehnRoot(root || cwd) || findProject(path.resolve(cwd))) return true;
  return !!root && !!(git(['ls-files', '--', `*${PROJECT_FILE}`], root) || '').trim();
}

function sessionStart(input) {
  if (!repoGated(input.cwd || process.cwd())) return;
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
  const cwd = input.cwd || process.cwd();
  if (!repoGated(cwd)) process.exit(0); // not a zehn app: stay silent
  const adds = workingAdds(cwd);
  if (!adds) process.exit(0);
  // In a repo that isn't zehn as a whole (a monorepo with one zehn package), check only files under a zehn.project.json.
  const root = gitRoot(existingDir(path.resolve(cwd)));
  if (!zehnRoot(root || cwd)) for (const f of Object.keys(adds)) if (!findProject(path.dirname(f))) delete adds[f];
  let snap = {};
  try { snap = JSON.parse(fs.readFileSync(snapPath(input.session_id), 'utf8')); } catch {}
  const problems = [];
  let ignores = 0;
  for (const [f, ls] of Object.entries(adds)) {
    const before = new Map();
    for (const t of snap[f] || []) before.set(t, (before.get(t) || 0) + 1);
    const fresh = ls.filter((l) => { const k = l.text.trim(); if (before.get(k)) { before.set(k, before.get(k) - 1); return false; } return true; });
    ignores += fresh.filter((l) => /zehn-ignore/.test(l.text)).length;
    problems.push(...checkLines(fresh, f, { changed: true }));
  }
  const dsDirs = [...new Set(problems.filter((p) => p.id === 'design-system-edit').map((p) => p.text))];
  const errs = problems.filter((p) => p.id !== 'design-system-edit');
  const dsNote = dsDirs.length ? `\nAlso: this session changed the shared design system (${dsDirs.join(', ')}). List it under Design gaps as "design-system change, designer sign-off needed".\n` : '';
  if (!errs.length) {
    if (dsNote) process.stdout.write(JSON.stringify({ systemMessage: dsNote.trim() }));
    process.exit(0);
  }
  process.stderr.write(
    `zehn design system: before you finish, these lines changed in this session (including through Bash or scripts) break the style rules. Fix them. Only for a value the user asked for: ${IGNORE_FMT} ${IGNORE_SYNTAX} on each line, plus a Design gaps line:\n` +
    format(errs, 30) + '\n' + dsNote);
  process.exit(2);
}

// ---------- main ----------
const args = process.argv.slice(2);
const readStdin = (fn) => { let raw = ''; process.stdin.on('data', (d) => (raw += d)); process.stdin.on('end', () => fn(raw)); };
if (args[0] === '--stop') readStdin(stopMode);
else if (args[0] === '--session-start') readStdin((raw) => { try { sessionStart(JSON.parse(raw)); } catch {} });
else if (args.length) {
  const all = [];
  const files = args.filter((f) => !skipped(f) && fs.existsSync(f));
  const ungated = files.filter((f) => !gated(f));
  if (ungated.length) console.log(`zehn style check: note: ${ungated.length === files.length ? 'this repo' : ungated.map((f) => path.basename(f)).join(', ')} isn't a zehn app (no zehn.project.json or --zm- tokens); the hooks skip it, checking anyway with zehn's rules.`);
  const shared = new Set();
  for (const f of files) {
    all.push(...checkLines(fs.readFileSync(f, 'utf8').split('\n').map((text, i) => ({ n: i + 1, text })), f));
    const ds = gated(f) && designSystemDir(path.resolve(f));
    if (ds) shared.add(ds);
  }
  if (shared.size) console.log(`zehn style check: note: some of these files are in the shared design system (${[...shared].join(', ')}); changes there need designer sign-off (list them under Design gaps).`);
  if (!all.length) { console.log('zehn style check: clean'); process.exit(0); }
  const byRule = {};
  for (const p of all) byRule[p.id] = (byRule[p.id] || 0) + 1;
  console.log(`zehn style check: ${all.length} issue(s) (${Object.entries(byRule).map(([k, v]) => `${k} ${v}`).join(', ')})\n` + format(all, 500));
  process.exit(1);
} else readStdin(hookMode);

