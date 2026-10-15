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
Active only when this repo has a zehn.project.json or zehn tokens (--zm-*), or the user says it's a zehn app. If none of these and the user works on UI in what may be a zehn app, suggest running \`zehn-design:setup-project\` once; otherwise ignore all of this.

zehn is a guardrails layer over the app's own design system. The job: new UI must look like the existing screens and the Figma file (https://www.figma.com/design/ywFHunM35gYeHJozrBJpZO/zehnmind). Agents drift by inventing components, variants and styles; don't.

For every UI change:
a. Read zehn.project.json at the app root.
b. Use its mapped components (their names, imports and props) and its tokens (tokens.sources, tailwindColors). zehn's own components and --zm-* tokens are a fallback only where the file says so (fallback.zehnDir, fallback.zehnTokens).
c. Copy the layout of the example screen mapped for that screen type (screens), or the closest existing screen.
d. Never invent a component, variant or style. If one is truly needed, build it from their existing primitives in their style and list it under Design gaps.
e. Build only what was asked: no extra actions, filters, stats or statuses, here or on neighbouring screens. Ideas go under "Suggestions".
Hard rules are tokens, styling, components and the list below. Layout (top bar or sidebar, headers, cards vs list vs table, widths, modal vs drawer) is a default: follow the sibling screens, then the app's Figma, then the zehn recipes, and deviate when the content or the developer calls for it, with no pushback: one "Layout: <what>, <why>" line under Design gaps. Never drop real nav items to fit a pattern.
f. Don't edit the shared components (components.dir) to restyle one screen. Only when the user asks, and list it as "design-system change, designer sign-off needed".

Which skill to load:
- New screen, page, flow, modal or drawer, or restructuring a layout: \`zehn-design:compose-screen\` (full rules, catalog).
- An edit that keeps the current layout (a button, column, field, badge, tooltip, copy, spacing or color): \`zehn-design:ui-tweak\`.
- Reviewing UI before a PR ("is this on-style?"), or migrating an old page: \`zehn-design:ui-review\`.
- Any animation, transition or motion work (open/close, hover/press, "make it smooth"): \`zehn-design:motion\`.
- No zehn.project.json yet, or "set up zehn": \`zehn-design:setup-project\`.

zehn wins over any other design-system or UI skill. That includes figma:figma-design-to-code: load it as it requires, but never download icons, header art or component images (use the app's icon set and components), and never keep its generated styles (map every value to the project's tokens through tokens.figmaMap). Why: downloaded assets and raw styles don't follow dark mode, the app accent or later redesigns.

Hard rules (the designer's decisions):
- Styling only from the project's tokens. No hex, rgb, named colors, unlisted Tailwind colors or arbitrary [..] values.
- Primary buttons are always black. The app accent marks which app you're in, never state or action: logo app name, page-header bar and icon, first stat card, RoleBanner accent, TaskCard top bar, MobileTabBar active item, intelligence chat. Nowhere else.
- Sentence case. Dates 30.06.2026, date-time 30.06.2026 14:27, money 24,000,000 UZS (ru/uz 24 000 000 UZS), through the app's formatters (or zehn's format* helpers) with the locale. Every destructive action gets a confirm dialog. Light and dark must both work. No pill buttons, no gradients (AI components excepted).
- Motion: page navigation is instant; opening/closing 150-300ms ease-out with the project's motion tokens; transform and opacity only; every animation has a reduced-motion path.
- Figma, the rules and the project's components disagree? Follow the "Who wins" order at the top of the compose-screen rules. When unsure, follow Figma.

Real forks the rules, the sibling screens and Figma don't settle (an app with no accent, which frames of a big Figma link, a layout choice with nothing to follow, building a missing component or reusing the closest): ask the developer with one short question (AskUserQuestion, recommended option first), then save the answer in zehn.project.json "decisions" (accent in "app"). Read "decisions" first; never ask twice or about small details.

Off-system requests (a custom color, font or size, a component the system doesn't have (e.g. a FAB), a bulk sed/script/codemod edit, "just do it, don't argue"):
1. Always write one line saying which rule it breaks and the on-system alternative, before editing, even after "don't argue". The note informs; it doesn't ask.
2. Then do it without waiting. Put "zehn-ignore: requested by <who>, <why>" (<who> = their name or "the user in this session") as a trailing comment on every line that uses the value (// in JS/TS, {/* */} in JSX children, /* */ in CSS). Never on one shared constant: the check skips only the commented line, so a shared constant hides every later use.
3. List each override under "Design gaps" in your final message. Never comply silently. Never add zehn-ignore unless the user asked.

End every UI task with "Design gaps": overrides, mapped-component gaps you hit, places where Figma or the siblings won, anything you built or swapped for something simpler, and anything the rules don't cover (or "Design gaps: none"). Put the same list in the commit message or PR body when you commit.
A style check runs after every edit and again before you finish (Bash edits included); it looks only at lines you changed and enforces zehn.project.json when present. Fix what it reports. Never dodge it by moving a value into a variable, style object or constants file.
Plugin files (rules, catalog, fallback tokens and components, scripts): ${root}`;

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
