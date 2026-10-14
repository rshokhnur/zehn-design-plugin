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
const SPACE_HINT = 'zehn spacing (Tailwind keys): 0 px 0.5 1 1.5 2 2.5 3 4 5 6 8 10 12 16 18 24 32 = 0 1 2 4 6 8 10 12 16 20 24 32 40 48 64 72 96 128px';

// Known --zm-* variables, read from the plugin's tokens.css.
const KNOWN_VARS = (() => {
  try {
    const css = fs.readFileSync(path.resolve(__dirname, '../tokens/tokens.css'), 'utf8');
    return new Set([...css.matchAll(/(--zm-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  } catch { return null; }
})();
// Color keys in the preset (so we can tell a real color class from one that renders nothing).
const COLOR_KEYS = (() => {
  try { return new Set(Object.keys(require('../tokens/tailwind.preset.cjs').theme.colors)); } catch { return null; }
})();

const NAMED = 'aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|grey|green|greenyellow|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen';
const TW_HUES = 'slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const COLOR_PROPS = 'bg|text|border|border-[xytrblse]|ring|ring-offset|outline|fill|stroke|from|via|to|divide|placeholder|caret|accent|decoration|shadow';
const V = '(?:[a-z0-9-]+:)*'; // variants like hover: md: dark:

// ---------- web (JS/TS/JSX/Vue/HTML) + CSS rules ----------
const MSG = {
  hex: 'Hardcoded hex color. Use a token: var(--zm-text-primary), bg-status-danger-bg… (reference/tokens.md).',
  rgb: 'Hardcoded rgb/hsl color. Use a --zm-* token.',
  named: 'Named CSS color. Use a --zm-* token (e.g. var(--zm-text-primary), var(--zm-const-white)).',
  palette: 'Tailwind default palette class. It renders nothing under the zehn preset. Use bg-surface-*, text-text-*, bg-primary-bg, text-status-*, bg-cyan-fill-2…',
  deadColor: 'This color class renders nothing under the zehn preset (no such token). Use a zehn color: text-text-secondary, bg-surface-subtle, border-border-default…',
  arbColor: 'Arbitrary Tailwind value. Use a theme class or [var(--zm-…)].',
  arbSpace: `Arbitrary spacing. ${SPACE_HINT}.`,
  arbType: 'Arbitrary font size/weight/radius/tracking. Use text-xs…text-2xl, font-normal/font-semibold, rounded/rounded-lg/xl/2xl/full.',
  arbSize: 'Arbitrary size/z-index. Use a standard Tailwind size key or a zehn layout key: max-w-column-narrow, max-w-column-detail, w-modal, w-drawer, h-topbar-height, h-row…',
  offSpace: `Off-scale spacing class. ${SPACE_HINT}.`,
  radius: 'Off-scale or unknown radius. zehn radius: rounded-none, rounded-sm (2), rounded (4), rounded-lg (8), rounded-xl (12), rounded-2xl (16), rounded-3xl (24), rounded-full.',
  shadow: 'Default Tailwind shadow renders nothing under the zehn preset. Use shadow-100 (cards), shadow-200 (popovers), shadow-300 (modals), shadow-focus.',
  textSize: 'No such text size in zehn (largest is text-7xl, marketing only).',
  weight: 'Only two weights exist: 400 (font-normal) and 600 (font-semibold).',
  family: 'Only Inter (var(--zm-font-sans)) is allowed.',
  unknownVar: 'Unknown zehn token. This --zm-* variable does not exist; check reference/tokens.md.',
  ignore: 'zehn-ignore needs a reason: "zehn-ignore: requested by <who>, <why>" (and list it under Design gaps).',
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
    ok: (line) => /^\s*(\/\/|\*|\/\*)/.test(line) },
  { id: 'named-color', msg: MSG.named,
    re: new RegExp(`\\b(?:color|background(?:-color)?|border(?:-[a-z]+)?-color|border(?:-[a-z]+)?|outline(?:-color)?|fill|stroke|caret-color|text-decoration(?:-color)?|accent-color|box-shadow)\\s*:\\s*(?:[^;'"{}]*\\s)?(?:${NAMED})\\b(?![-\\w])`, 'g') },
  // CSS-in-JS: unambiguous keys always; color/fill/stroke/background only in a style context (not data like { color: 'green' }).
  { id: 'named-color', msg: MSG.named,
    re: new RegExp(`\\b(color|fill|stroke|background|backgroundColor|borderColor|borderTopColor|borderBottomColor|outlineColor|textDecorationColor|caretColor|accentColor|border|borderTop|borderRight|borderBottom|borderLeft|outline|boxShadow|textDecoration)\\s*:\\s*['"\`](?:[^'"\`]*\\s)?(?:${NAMED})\\b(?![-\\w])`, 'g'),
    ok: (line, i, kind, m) => /^(color|fill|stroke|background)$/.test(m[1]) && !/\bstyle\b|\bsx\b|\bcss\b|styled|StyleSheet|CSSProperties/.test(line) },
  { id: 'important', msg: 'Overriding zehn styles with !important is not allowed. Use the component props or tokens; if you truly must, add zehn-ignore with a reason.',
    re: /!important\b/g, ok: (line) => /^\s*(\/\/|\*|\/\*)/.test(line) },
  { id: 'tw-default-palette', msg: MSG.palette, cls: true,
    re: new RegExp(`(?<![\\w-])${V}(?:${COLOR_PROPS})-(?:${TW_HUES}|gray)-\\d{2,3}(?:\\/\\d+)?(?![\\w-])`, 'g'),
    ok: (line, i, kind, m) => /-gray-/.test(m[0]) && COLOR_KEYS && COLOR_KEYS.has(m[0].replace(/^.*?-(gray-\d+).*$/, '$1')) },
  { id: 'tw-arbitrary-color', msg: MSG.arbColor, cls: true,
    re: new RegExp(`(?<![\\w-])${V}(?:${COLOR_PROPS})-\\[(?!var\\(--zm-)(?!\\d)[^\\]]+\\]`, 'g') },
  { id: 'tw-arbitrary-spacing', msg: MSG.arbSpace, cls: true,
    re: new RegExp(`(?<![\\w-])${V}-?(?:p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|inset|inset-x|inset-y|top|right|bottom|left|start|end|scroll-m|scroll-p)-\\[(?!var\\(--zm-)[^\\]]+\\]`, 'g') },
  { id: 'tw-arbitrary-type', msg: MSG.arbType, cls: true,
    re: new RegExp(`(?<![\\w-])${V}(?:text|leading|tracking|font|rounded(?:-[trblse]{1,2})?)-\\[(?!var\\(--zm-)[^\\]]+\\]`, 'g') },
  { id: 'tw-arbitrary-size', msg: MSG.arbSize, cls: true,
    re: new RegExp(`(?<![\\w-])${V}-?(?:w|h|min-w|max-w|min-h|max-h|size|z|basis)-\\[(?!var\\(--zm-)[^\\]]+\\]`, 'g') },
  { id: 'off-scale-class', msg: MSG.offSpace, cls: true,
    re: new RegExp(`(?<![\\w-])${V}-?(?:p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y)-([\\d.]+|px)(?![\\w.-]|\\/)`, 'g'),
    ok: (line, i, kind, m) => TW_SPACE_KEYS.has(m[1]) },
  { id: 'radius', msg: MSG.radius, cls: true,
    re: new RegExp(`(?<![\\w-])${V}rounded(?:-[trblse]{1,2})?-(md|\\d+)(?![\\w-])`, 'g') },
  { id: 'shadow', msg: MSG.shadow, cls: true,
    re: new RegExp(`(?<![\\w-])${V}shadow(?:-(?:sm|md|lg|xl|2xl|inner))?(?![\\w-])`, 'g'),
    ok: (line, i) => /^\s*(\/\/|\*)/.test(line) },
  { id: 'text-size', msg: MSG.textSize, cls: true, re: new RegExp(`(?<![\\w-])${V}text-(?:8xl|9xl)(?![\\w-])`, 'g') },
  { id: 'font-weight', msg: MSG.weight,
    re: /font-weight\s*:\s*(?:[12357-9]00|bold|bolder|lighter)\b|fontWeight\s*:\s*['"]?(?:[12357-9]00|bold|bolder|lighter)\b/g },
  { id: 'font-weight-class', msg: MSG.weight, cls: true,
    re: new RegExp(`(?<![\\w-])${V}font-(?:thin|extralight|light|medium|bold|extrabold|black)(?![\\w-])`, 'g') },
  { id: 'font-family', msg: MSG.family,
    re: /font-family\s*:\s*(?!\s*(?:var\(--zm-font|['"]?Inter\b|inherit|initial|unset))[^;}]+|fontFamily\s*:\s*['"`]+(?!Inter\b|var\(--zm)[^'"`,]+/g },
  { id: 'font-shorthand', msg: MSG.family, re: /(?<![\w-])font\s*:\s*([^;}]+)/g,
    ok: (line, i, kind, m) => /Inter\b|var\(--zm|inherit|initial|unset/.test(m[1]) || !/\d/.test(m[1]) },
  { id: 'unknown-token', msg: MSG.unknownVar, re: /--zm-[a-z0-9-]+/g,
    ok: (line, i, kind, m) => !KNOWN_VARS || KNOWN_VARS.has(m[0]) || /:\s*$/.test(line.slice(0, i + m[0].length + 1)) || /^\s*--zm-[a-z0-9-]+\s*:/.test(line.slice(i)) },
];

function deadColorClasses(line, kind, push) {
  if (!COLOR_KEYS) return;
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
    if (COLOR_KEYS.has(val)) continue;
    if (!inClassContext(line, m.index, kind)) continue;
    push(m.index, m[0], 'dead-class', MSG.deadColor);
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
    while ((c = t.exec(m[2]))) push(m.index + 1 + c.index, c[1], 'important', 'Tailwind !important override. Use the component props or tokens instead of forcing styles onto zehn components.');
  }
}

// Hand-made primitives in app code (the zehn components live in components/zehn or the plugin's components/react).
const OWN_COMPONENTS = /components\/(zehn|react)\//;
const PRIMITIVES = [
  [/<button\b/g, 'Raw <button>. Use the zehn <Button variant=…> or <IconButton>.'],
  [/<select\b/g, 'Raw <select>. Use the zehn <Select>.'],
  [/<input\b[^>]*type=["'](?:checkbox|radio)["']/g, 'Raw checkbox/radio. Use the zehn <Checkbox>, <Radio> or <Switch>.'],
  [/<dialog\b|\bwindow\.confirm\(|(?<![\w.])confirm\(\s*['"`]|(?<![\w.])alert\(\s*['"`]/g, 'Native dialog. Use the zehn <Modal>, <AlertDialog> (destructive confirm) or a Toast.'],
];
function rawPrimitives(line, push) {
  if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
  for (const [re, msg] of PRIMITIVES) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(line))) push(m.index, m[0], 'raw-primitive', msg);
  }
}

function cssPx(line, push) {
  const re = /\b(padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left|border-radius|font-size)(?:-[a-z]+)?\s*:\s*([^;}{]+)/g;
  let m;
  while ((m = re.exec(line))) {
    const prop = m[1];
    const nums = [...m[2].matchAll(/(-?\d+(?:\.\d+)?)px/g)].map((x) => Math.abs(parseFloat(x[1])));
    const set = prop === 'border-radius' ? RADIUS : prop === 'font-size' ? FONT_SIZE : SPACE;
    const bad = nums.filter((n) => !set.has(n));
    if (bad.length) push(m.index, m[0].trim(), 'off-scale', `Off-scale ${prop}: ${bad.join('px, ')}px. Use var(--zm-space-*), var(--zm-radius-*) or a text style.`);
  }
  const js = /\b(padding|margin|gap|rowGap|columnGap|fontSize|borderRadius)(?:Top|Right|Bottom|Left|X|Y|Horizontal|Vertical|Inline|Block)?\s*:\s*(\d+(?:\.\d+)?)\b(?!\s*[%a-z])/g;
  while ((m = js.exec(line))) {
    const n = parseFloat(m[2]);
    const set = m[1] === 'borderRadius' ? RADIUS : m[1] === 'fontSize' ? FONT_SIZE : SPACE;
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
    { id: 'native-font', re: /fontFamily:\s*['"](?!Inter)/g, msg: MSG.family },
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
function checkLine(line, file, prev = '') {
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
      r.re.lastIndex = 0;
      let m;
      while ((m = r.re.exec(line))) {
        if (r.ok && r.ok(line, m.index, kind, m)) continue;
        if (r.cls && !inClassContext(line, m.index, kind)) continue;
        push(m.index, m[0], r.id, r.msg);
      }
    }
    deadColorClasses(line, kind, push);
    importantClasses(line, push);
    if (kind === 'web' && !OWN_COMPONENTS.test(file)) rawPrimitives(line, push);
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
    while ((m = hx.exec(line))) push(m.index, m[0], 'hex-color', MSG.hex);
  }
  return out;
}

// lines: [{n, text}]
function checkLines(lines, file) {
  const probs = [];
  lines.forEach(({ n, text }, i) => {
    const prev = lines.slice(Math.max(0, i - 2), i).map((l) => l.text).join('\n');
    for (const p of checkLine(text, file, prev)) probs.push({ file, line: n, ...p });
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
  if (!UI_EXT.test(file) || SKIP.test(file)) process.exit(0);
  const lines = changedLines(input);
  const problems = checkLines(lines, file);
  if (problems.length) {
    process.stderr.write(
      `zehn design system: lines you just changed in ${path.basename(file)} break the style rules. Fix these now with zehn tokens and components:\n` +
      format(problems, 30) +
      `\nIf a value truly has no token, or the user insisted on it, keep it with a trailing comment "zehn-ignore: <who asked / why>" on EVERY line that uses it, and list it under Design gaps in your final message.\n`);
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
    if (!UI_EXT.test(abs) || SKIP.test(abs)) continue;
    try {
      const st = fs.statSync(abs);
      if (st.size > 2e6) continue;
      res[abs] = fs.readFileSync(abs, 'utf8').split('\n').map((text, i) => ({ n: i + 1, text }));
    } catch {}
  }
  for (const f of Object.keys(res)) if (!UI_EXT.test(f) || SKIP.test(f)) delete res[f];
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
    `zehn design system: before you finish, these lines changed in this session (including through Bash or scripts) break the style rules. Fix them, or mark user-requested exceptions with "zehn-ignore: <who asked / why>" and list them under Design gaps:\n` +
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
    if (!UI_EXT.test(f) || SKIP.test(f) || !fs.existsSync(f)) continue;
    all.push(...checkLines(fs.readFileSync(f, 'utf8').split('\n').map((text, i) => ({ n: i + 1, text })), f));
  }
  if (!all.length) { console.log('zehn style check: clean'); process.exit(0); }
  const byRule = {};
  for (const p of all) byRule[p.id] = (byRule[p.id] || 0) + 1;
  console.log(`zehn style check: ${all.length} issue(s) (${Object.entries(byRule).map(([k, v]) => `${k} ${v}`).join(', ')})\n` + format(all, 500));
  process.exit(1);
} else readStdin(hookMode);

