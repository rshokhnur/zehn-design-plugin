# Changelog

## 1.2.0 (15.10.2026)
From the designer's rounds 3 and 4 (the office welcome page, and the task and analytics module pages).

- **TopBar fix:** the active nav tab now shows its subtle fill. The ghost button's transparent background used to win. `buttonClass` has a `selected` option; disabled ghost buttons no longer stack two backgrounds either.
- **App accents:** office (Cyan, from the Figma logo), meet (Pink, from the Figma product tag), aip (the intelligence assistant, Cyan), `task` as an alias of tasks. anbar and abat stay on the default Cyan until the designer picks theirs.
- **Assistant orb:** `Orb` (default, listening, thinking) and `OrbLauncher`, from the Figma intelligence frames. Its glow uses the new `bg-ai-gradient` token, the one gradient the rules allow.
- **Theme switch:** `setTheme()` / `useTheme()` turn transitions off while light and dark swap, so hover colors don't animate across the page.
- **New patterns:** `AppSwitcher` (the cross-module sidebar in zehn office, active item neutral, each module in its own accent) and `ObjectCard` + `ObjectGrid` (the Figma Board Card, for boards, dashboards and projects).
- Style check: knows `bg-ai-gradient`.

## 1.1.0 (15.10.2026)
From the designer's own test (a Shopify admin screen rebuilt as zehn, plus a date range picker).

**Layout is a default, not a rule**
- Hard rules stay hard: tokens and styling, the team's components, nothing invented, black primary, accent list, formats, confirm before destructive actions, light/dark, accessibility.
- Layout (top bar or sidebar, page headers, HeaderPattern, stat cards, cards vs list vs table, widths, modal vs drawer) follows the app's sibling screens, then the app's Figma, then the zehn recipes. Agents may deviate when the content or the developer calls for it, with no pushback: one `Layout: <what>, <why>` line under Design gaps. Real nav items are never dropped to fit a pattern.
- ui-review asks about unexplained layout differences under "Needs a decision" and no longer "fixes" layouts to the recipes. The style check has no layout rules.

**Style check**
- Editing the shared components folder is now a note shown once per file, not a blocking error. Building a missing component there is allowed; it still goes under Design gaps. Whole-file mode prints the same note.
- New: `tracking-*` (zehn sets letter spacing in the preset), `<div>`/`<span>` with `onClick`, and pill-shaped clickable elements.

**Rules**
- Money in the data's own currency when it has one (`formatMoney(827, locale, 'USD')`); UZS stays the default. Never convert or relabel amounts.
- Narrow screens: no sideways scroll down to 1024px; rows wrap, extra nav goes into a `…` menu.
- Week starts on Monday; month and weekday names come from the locale.
- Which app: use the repo's `data-app`; for a new area, ask and use the closest app meanwhile.
- The empty-folder path is kept short: the plugin is built for existing projects.

## 1.0.0 (15.10.2026)
First production release, after the final stress test (12 runs with and without the plugin, plus CSS Modules, styled-components, shadcn and non-zehn repos).

**Style check**
- Runs only in zehn repos: a `zehn.project.json`, zehn enabled in `.claude/settings.json`, or `--zm-*` tokens. Elsewhere it is silent, and the session text is one line.
- Edits inside the shared components folder (`components.dir`, mapped imports) are flagged once per file: "designer sign-off needed".
- Gradients and pill (`rounded-full`) buttons and inputs are flagged. The AI components are exempt.
- Radius, font size, font weight and raw widths/heights are checked in project mode too, against the app's own keys (`tokens.radiusKeys`, `fontSizeKeys`, `fontWeights`, or read from its Tailwind config).
- With `tokens.sources`, only declared CSS variables pass, so made-up `var(--hr-anything)` is caught.
- Fewer false hits from the look-alike check: it skips skeletons, styled sub-parts and plain strings, and fires only when the new component renders the raw element or lives in a shared folder.
- New motion rules: no `transition-all`, no durations over 300ms, no width/height/margin animation, no bounce, no `scale(0)`, and a reduced-motion path for new animations.

**Motion (new)**
- `motion` skill: when to animate, easing and duration tables, recipes for modal, drawer, menu, tooltip, toast, press feedback, list changes, icon swaps, and reduced motion. Based on Emil Kowalski's guidance and the Figma prototypes, where navigation is instant and panels use 300ms ease-out.
- Tokens: `--zm-duration-fast|base|slow` (150/200/300ms), `--zm-ease-out|in-out|in`, `--zm-press-scale`. Tailwind: `duration-fast|base|slow`, `ease-out|in-out|in`, `scale-press`. All of them drop to 0 under reduced motion.
- Fallback components animate: Modal, AlertDialog, Drawer, Menu, Tooltip (an instant group after the first one), Toast, Switch, ProgressBar, and Button press feedback (`still` turns it off). New `usePresence` hook for exit animations.

**Rules**
- Who wins: the app's sibling screens now beat the catalog. If neighbours lack a pattern (HeaderPattern, stat cards), match them and list the gap.
- Build only what was asked: ideas go under "Suggestions", the data meaning stays as given, and shared components aren't restyled for one screen.
- Simpler substitutes (native inputs for a date-range picker) count as Design gaps. Design gaps also go in the commit message or PR body.
- `zehn-ignore` names a person, or "the user in this session".
- New craft details (§1a) from a foundations review: tabular numbers, 65ch prose, `…`, gap over margins, nested radius, disabled tokens rather than opacity, focus rings, one icon set, no `<div onClick>`. Also new: specific button and error copy, inline errors with an icon, 300ms search debounce, copy confirmation, a skip link, and text-only tooltips.

**setup-project**
- Records `motion` and `i18n` in `zehn.project.json`, plus the app's radius, type and weight keys.
- Handles an old or partial zehn install: a zehn preset that breaks the app's own classes, and stale copies.
- A primary that isn't black is reported as a designer decision and never changed silently.
- Fallback components are copied only into React + Tailwind apps; other stacks build in their own styling.

## 0.4.0 (14.10.2026)
Guardrails reframe: zehn guards the app's existing tokens, components and screens through `zehn.project.json`; `setup-tokens` became `setup-project`. Per-project install. "Who wins" order, radius table, accent list, `disabledReason`, warning RoleBanner.

## 0.3.0
Figma-matched cards (4px), badge, switch, toast; HeaderPattern, RoleBanner, en/ru/uz labels, `format*` helpers; layout tokens for charts and toasts.

## 0.2.0
Standard Tailwind spacing keys, new radius classes, `tailwind.preset.cjs`, Button `variant`, Badge `appearance`/`color`/`status`; raw-element and `!important` checks.

## 0.1.0
First version: tokens from Figma, compose-screen / ui-tweak / ui-review skills, style check hook.
