# Changelog

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
