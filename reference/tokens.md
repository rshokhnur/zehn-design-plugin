# zehn tokens cheat sheet

In an app with its own theme, use its tokens (`tokens` in `zehn.project.json`; Figma variable → token in `tokens.figmaMap`). The zehn tokens below are the fallback, and their names tell you which role a token plays.

All values come from Figma variables. Never hardcode a value that exists here. Before you call a token missing, check this sheet and the semantic tokens below; if nothing fits, use the nearest token and list it under Design gaps.
A fallback app gets copies of the token files through setup-project (`src/styles/zehn/`). The originals are in `${CLAUDE_PLUGIN_ROOT}/tokens/`.

## Setup in an app (once)
- setup-project wires `tokens.css` and the Tailwind preset (fallback only). The preset **replaces** colors, radius, font sizes and weights, shadows, transition durations and easings; it **keeps** Tailwind's spacing keys.
- On `<html>`: `data-app="<app>"`, the key from the rules §0 table (= `app.id` in `zehn.project.json`). Without it the accent is cyan. A module shown inside a host app sets `data-app` on its own root element; its accent goes in `app.modules` (rules §0).
- Theme toggle (zehn fallback only): `setTheme('light'|'dark'|'system')` or `const [theme, changeTheme] = useTheme()`; transitions are off for that frame. Set `data-theme` from storage in an inline `<head>` script too, or the page flashes.
- `data-theme="light"|"dark"` forces a theme. Without it the OS setting decides, so a light-only app must set `data-theme="light"`.

## Use semantic tokens first

| Need | CSS var | Tailwind |
|---|---|---|
| Main text | `--zm-text-primary` | `text-text-primary` |
| Secondary text / labels / meta | `--zm-text-secondary` | `text-text-secondary` |
| Placeholder / tertiary | `--zm-text-tertiary` | `text-text-tertiary` |
| Disabled text | `--zm-text-disabled` | `text-text-disabled` |
| Error text | `--zm-text-danger` | `text-text-danger` |
| Link | `--zm-text-link` | `text-text-link` |
| Page background | `--zm-surface-base` | `bg-surface-base` |
| Canvas behind cards / boards | `--zm-surface-canvas` | `bg-surface-canvas` |
| Subtle fill (table header, active tab) | `--zm-surface-subtle` | `bg-surface-subtle` |
| Hover fill (rows, ghost buttons, menu items) | `--zm-surface-hover` | `hover:bg-surface-hover` |
| Card, modal, drawer | `--zm-surface-raised` | `bg-surface-raised` |
| Menu / popover panel | `--zm-surface-overlay` | `bg-surface-overlay` |
| Borders / dividers | `--zm-border-default` | `border-border-default` |
| Input border | `--zm-border-strong` | `border-border-strong` |
| Focus border | `--zm-focus-ring` | `focus:border-focus-ring` |
| Primary button | `--zm-primary-bg` / `-bg-hover` / `-fg` | `bg-primary-bg hover:bg-primary-bg-hover text-primary-fg` |
| Secondary button | `--zm-secondary-bg` / `-bg-hover` / `-fg` | `bg-secondary-bg text-secondary-fg` |
| App accent (allowed uses: rules §0) | `--zm-app-accent`, `--zm-app-accent-fill`, `--zm-app-accent-stroke` | `text-app-accent`, `bg-app-accent-fill` |
| Status | `--zm-status-{success,warning,info,danger,neutral}` + `-bg` | `text-status-success bg-status-success-bg` |
| AI | `--zm-ai`, `--zm-ai-bg` | `text-ai bg-ai-bg` (`bg-ai-gradient` exists only for `Orb`; never elsewhere) |
| Disabled control | `--zm-disabled-bg` / `--zm-disabled-fg` | `bg-disabled-bg text-disabled-fg` |
| Dialog backdrop (stays dark in dark mode) | `--zm-scrim` | `bg-scrim` |
| Notification counter (red) | `--zm-counter-bg` / `--zm-counter-fg` | `bg-counter-bg text-counter-fg` |
| Tooltip | `--zm-tooltip-bg` / `--zm-tooltip-fg` | `bg-tooltip-bg text-tooltip-fg` |
| Progress bar | `--zm-progress-track` / `--zm-progress-fill` | `bg-progress-track`, `bg-progress-fill` |
| Segmented Control track | `--zm-bg-segment-track` | `bg-bg-segment-track` |
| Always white / always black (switch thumb, text on a solid hue) | `--zm-const-white` / `--zm-const-black` | `bg-const-white`, `text-white` |
| Charts (in this order; 1–7 keep 3:1 contrast, 8 needs labels) | `--zm-chart-1..8`, `-positive`, `-negative`, `-grid`, `-axis` | `fill-chart-1`, `stroke-chart-1`… |

Dark mode: `const-white`/`const-black` never flip. `gray-*` flips (black alpha → white alpha), so it works as a neutral tint but not as a surface or body text color; use `surface-*` and `text-*` for those.

## Primitives (only when no semantic token fits)
- Each hue: `--zm-{hue}`, `-lighter`, `-darker`, `-stroke`, `-fill-1`, `-fill-2`. Tailwind: `text-cyan`, `bg-cyan-fill-2`, `border-cyan-stroke`. Hues: cyan, teal, blue, violet, pink, coral, red, orange, lime, yellow-green, green, edu-green. `edu-green` has `-deep` and no `-lighter`; `green` and `yellow-green` add `-bg-strong`.
- Grays: `--zm-gray-50…900` (black at alpha; flips to white in dark). `--zm-alpha-50…900` is white at alpha, for dark or colored backgrounds.

## Type (Inter; 400 `font-normal` and 600 `font-semibold` only)
Every size already includes -0.01em tracking; never add `tracking-*`.

| Token | Size / line height | Use |
|---|---|---|
| `text-xxs` | 10/12 | tiny tags, small counters |
| `text-xs` | 12/16 | meta, IDs, helper text, table headers |
| `text-sm` | 14/20 | body default, labels, buttons, web card titles (`font-semibold`, like ObjectCard) |
| `text-base` | 16/24 | lead text, banner and dialog titles |
| `text-lg` | 18/24 | mobile card titles |
| `text-xl` | 20/28 | mobile pushed-screen titles |
| `text-2xl` | 24/32 | page H1 |
| `text-3xl` | 30/36 | mobile large titles |
| `text-4xl` to `text-7xl` | 36 to 72 | marketing pages only |

## Spacing
Tailwind's standard keys (`p-4` = 16px, `gap-3` = 12px). Allowed keys for padding, margin, gap and space: `0 px 0.5 1 1.5 2 2.5 3 4 5 6 8 10 12 16 18 24 32` (0–128px), plus `64 80 128` (256/320/512px) for section spacing only. Any other key (`p-7`, `mt-9`, `p-[13px]`) fails the style check.
Width and height can use any standard key (`h-8` 32, `h-10` 40) or the layout keys below.

## Radius
Classes: `rounded-none` 0 · `rounded-sm` 2 · `rounded` 4 · `rounded-lg` 8 · `rounded-xl` 12 · `rounded-2xl` 16 · `rounded-3xl` 24 · `rounded-4xl` 32 · `rounded-full`. No `rounded-md`. Which element gets which: the radius table in rules §1.

## Shadows
`shadow-100`, `shadow-200`, `shadow-300`, `shadow-mobile`, `shadow-focus`. Which element gets which: rules §1. Tailwind's `shadow-sm/md/lg` don't exist.

## Motion
| Token | Tailwind | Value |
|---|---|---|
| `--zm-duration-fast` | `duration-fast` (and plain `duration`) | 150ms |
| `--zm-duration-base` | `duration-base` | 200ms |
| `--zm-duration-slow` | `duration-slow` | 300ms |
| `--zm-ease-out` | `ease-out` (and plain `ease`) | `cubic-bezier(0.32, 0.72, 0, 1)` |
| `--zm-ease-in-out` | `ease-in-out` | `cubic-bezier(0.645, 0.045, 0.355, 1)` |
| `--zm-ease-in` | `ease-in` | `cubic-bezier(0.55, 0.055, 0.675, 0.19)` |
| `--zm-press-scale` | `scale-press` | 0.96 |
Durations drop to 0ms under reduced motion. Tailwind's `duration-200`, `duration-500` don't exist. When to use which: the `motion` skill.

## Layout constants (CSS var `--zm-<name>`, Tailwind `w-`/`h-`/`max-w-<name>`)
| Name | px | Use |
|---|---|---|
| `column-narrow` | 768 | content width: rules §2 |
| `column-detail` | 896 | 560 `detail-main` + 16 + 320 `side-panel`; content width: rules §2 |
| `topbar-height` | 56 | top bar |
| `subbar-height` | 64 | builder sub-bar |
| `gutter` | 24 | page side padding (`px-6`) |
| `modal` / `modal-wide` / `modal-xl` | 520 / 600 / 904 | container choice: rules §3 |
| `alert-dialog` | 520 | destructive confirm |
| `drawer` / `drawer-wide` | 520 / 640 | container choice: rules §3 |
| `header-icon` | 32 | page-header icon box and glyph |
| `table-header` / `row` / `row-dense` | 36 / 48 / 36 | data tables |
| `chart-card` / `chart-plot` | 334 / 208 | dashboard chart card / plot area height |
| `toast` | 432 | toast width |
