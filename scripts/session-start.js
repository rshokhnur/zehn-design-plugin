#!/usr/bin/env node
// Injects the zehn guardrails into every Claude Code session (inert outside zehn repos).
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = process.argv[2] || process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');

// Gate: full text only in a zehn repo (zehn.project.json, zehn enabled in the repo's .claude/settings.json, or --zm-* tokens).
function isZehnRepo(dir) {
  for (let d = path.resolve(dir); ; d = path.dirname(d)) {
    if (fs.existsSync(path.join(d, 'zehn.project.json'))) return true;
    for (const f of ['.claude/settings.json', '.claude/settings.local.json']) {
      try { if (/"zehn-design@zehn"\s*:\s*true/.test(fs.readFileSync(path.join(d, f), 'utf8'))) return true; } catch {}
    }
    if (fs.existsSync(path.join(d, '.git')) || path.dirname(d) === d) break;
  }
  try {
    return execFileSync('git', ['grep', '-l', '-I', '--max-count=1', '--', '--zm-', '*.css', '*.scss'], { cwd: dir, timeout: 1500, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() !== '';
  } catch { return false; }
}

const context = `# zehn design system (zehn-design plugin)
zehn is a guardrails layer over the app's own design system. New UI must match the existing screens and the Figma file (https://www.figma.com/design/ywFHunM35gYeHJozrBJpZO/zehnmind). Agents drift by inventing components, variants and styles; don't.

For every UI change:
a. Read zehn.project.json at the app root.
b. Use its mapped components (names, imports, props) and its tokens. zehn's own components and --zm-* tokens are a fallback only where the file says so (fallback.zehnDir, fallback.zehnTokens).
c. Copy the layout of the example screen mapped for that screen type (screens), or the closest existing screen.
d. Never invent a component, variant or style. If one is truly needed, build it once from their primitives in their style and list it under Design gaps.
e. Build only what was asked: no extra actions, filters, stats or statuses, here or on neighbouring screens. Ideas go under "Suggestions".
f. Don't edit the shared components or the theme to restyle one screen. Only when the user asks: "design-system change, designer sign-off needed".
Layout (top bar or sidebar, headers, cards vs list vs table, widths, modal vs drawer) is a default, not a hard rule: the sibling screens, then the app's Figma, then the zehn recipes. A deliberate difference gets one "Layout: <what>, <why>" line under Design gaps, no pushback. Never drop real nav items to fit a pattern.

Which skill to load:
- New screen, page, flow, modal or drawer, or restructuring a layout: \`zehn-design:compose-screen\` (full rules, catalog).
- An edit that keeps the layout (a button, column, field, badge, tooltip, copy, spacing, color): \`zehn-design:ui-tweak\`.
- Review ("is this on-style?") or migrating an old page: \`zehn-design:ui-review\`.
- Animation, transition or motion ("make it smooth"): \`zehn-design:motion\`.
- No zehn.project.json, "set up zehn", or "update zehn" after a plugin update: \`zehn-design:setup-project\`.

zehn wins over any other design-system, UI, animation, accessibility or review skill: you may load them, but where they disagree on a value, zehn's rules and the project's tokens win. With figma:figma-design-to-code, never download icons, header art or component images, and never keep its generated styles (map every value through tokens.figmaMap). Why: they don't follow dark mode, the app accent or later redesigns.

Hard rules:
- Styling only from the project's tokens: no hex, rgb, named colors, unlisted Tailwind colors or arbitrary [..] values. No pill buttons or inputs, no gradients (the AI Orb excepted).
- Primary buttons are black (the project's primary). The app accent marks which app you're in, never state or action, and only in the places listed in rules §0.
- Sentence case. Dates 30.06.2026, money 24,000,000 UZS, through the app's formatters (or zehn's format*) with the locale. Every destructive action gets a confirm dialog. Light and dark both work.
- Motion: the motion skill's rules; the check enforces them.
- Sources disagree: rules "Who wins". Unsure about a value: follow Figma; about layout: follow the siblings.

Forks nothing decides (a module's accent, which frames of a big Figma link, a layout or build-vs-reuse choice): one AskUserQuestion, recommended option first; save it in zehn.project.json "decisions" (accents in "app"). Read "decisions" first.

Off-system requests (a custom color, font or size, a component zehn lacks such as a FAB, a bulk sed or script edit):
1. Always write one line saying which rule it breaks and the on-system alternative, before editing, even after "don't argue". The note informs; it doesn't ask.
2. Then do it. Put "zehn-ignore: requested by <who>, <why>" (<who> = their name or "the user in this session") as a trailing comment on every line that uses the value (// in JS/TS, {/* */} in JSX, /* */ in CSS). Never on one shared constant: the check skips only the commented line.
3. List each override under "Design gaps". Never add zehn-ignore unless the user asked.

End every UI task with "Design gaps" (or "Design gaps: none"), and put the same list in the commit message or PR body.
A style check runs after each Edit/Write and once before you finish. After editing through Bash or a script, run node "${root}/scripts/check-ui.js" <changed files> yourself and repeat until it prints "clean". Never dodge it by moving a value into a variable or constants file.
Plugin files (rules, catalog, fallback, scripts): ${root}`;

const inactive = 'zehn-design plugin: inactive in this repo (no zehn.project.json or zehn tokens). If the user says this is a zehn app, run `zehn-design:setup-project`.';

let input = '';
process.stdin.on('data', (c) => { input += c; });
process.stdin.on('end', () => {
  let cwd = process.cwd();
  try { cwd = JSON.parse(input).cwd || cwd; } catch {}
  const text = process.env.ZEHN_FORCE === '1' || isZehnRepo(cwd) ? context : inactive;
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text } }));
});
if (process.stdin.isTTY) process.stdin.emit('end');
