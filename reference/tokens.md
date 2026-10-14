# zehn tokens cheat sheet

Files: `tokens/tokens.css` (CSS variables, light + dark + app accents), `tokens/tailwind.preset.js` (Tailwind theme, **replaces** the default palette), `tokens/tokens.json` (other stacks).
All values come from Figma variables. Never hardcode a value that exists here. If something is missing, ask; don't invent.

## Setup in an app (once)
- Import `tokens.css` at the root.
- Tailwind: `presets: [require('./zehn/tailwind.preset.js')]`. In v4: `@config "./zehn/tailwind.preset.js";` + `@import "./zehn/tokens.css";`.
- On `<html>`: `data-app="hr"` (picks the accent) and optionally `data-theme="dark"`.

## Use semantic tokens first

| Need | CSS var | Tailwind |
|---|---|---|
| Main text | `--zm-text-primary` | `text-text-primary` |
| Secondary text / labels / meta | `--zm-text-secondary` | `text-text-secondary` |
| Placeholder / tertiary | `--zm-text-tertiary` | `text-text-tertiary` |
| Link | `--zm-text-link` | `text-text-link` |
| Page background | `--zm-surface-base` | `bg-surface-base` |
| Canvas behind cards / boards | `--zm-surface-canvas` | `bg-surface-canvas` |
| Subtle fill (table header, hover, active tab) | `--zm-surface-subtle` | `bg-surface-subtle` |
| Card / popover | `--zm-surface-raised` | `bg-surface-raised` |
| Borders / dividers | `--zm-border-default` | `border-border-default` |
| Primary button | `--zm-primary-bg` / `--zm-primary-fg` | `bg-primary-bg text-primary-fg` |
| Secondary button | `--zm-secondary-bg` / `--zm-secondary-fg` | `bg-secondary-bg` |
| App accent (logo, header bar and icon, first stat card only) | `--zm-app-accent`, `--zm-app-accent-fill` | `text-app-accent`, `bg-app-accent-fill` |
| Status | `--zm-status-{success,warning,info,danger,neutral}` + `-bg` | `text-status-success bg-status-success-bg` |
| AI | `--zm-ai`, `--zm-ai-bg` | `text-ai bg-ai-bg` |
| Charts | `--zm-chart-1..8`, `--zm-chart-positive`, `--zm-chart-negative`, `--zm-chart-grid`, `--zm-chart-axis` | same names |

## Primitives (only when no semantic token fits)
- Each hue has `--zm-{hue}`, `-lighter`, `-darker`, `-stroke`, `-fill-1`, `-fill-2`. Hues: cyan, teal, blue, violet, pink, coral, red, orange, lime, yellow-green, green, edu-green.
- Grays: `--zm-gray-50…900` (black at alpha; flips to white in dark). `--zm-alpha-50…900` is white at alpha, for use on dark or colored backgrounds.
- Backgrounds: `--zm-bg-b0`, `-b1`, `-b2`, `-b3`.
- Action: `--zm-action-bg`, `-bg-hover`, `-text`, `-icon`, `-counter-bg`.

## Type (Inter; weights 400 `font-normal` and 600 `font-semibold` only)

| Token | Size / line height | Typical use |
|---|---|---|
| `text-xxs` | 10/12 | tiny tags |
| `text-xs` | 12/16 | meta, IDs, helper text, table headers |
| `text-sm` | 14/20 | body default, labels, buttons |
| `text-base` | 16/24 | lead text, banner titles |
| `text-lg` | 18/24 | card titles |
| `text-xl` | 20/28 | mobile titles |
| `text-2xl` | 24/32 | page H1 |
| `text-3xl` | 30/36 | mobile large titles |
| `text-4xl` to `text-7xl` | 36 to 72 | marketing only |

## Spacing (px)
0 1 2 4 6 8 10 12 16 20 24 32 40 48 64 72 96 128 256 320 512.
Tailwind: `p-16` = 16px (the keys are pixel values, not the 4px scale).

## Radius
`rounded-4`, `-8` (default), `-12`, `-16` (mobile cards), `-full`.

## Shadows
`shadow-100` (cards), `-200` (popovers), `-300` (modals), `-mobile`, `-focus`.

## Layout constants
| Constant | Value |
|---|---|
| top bar | 56 |
| gutter | 24 |
| narrow column | 768 |
| detail | 896 (560 + 16 + 320) |
| modal / drawer | 520 |
