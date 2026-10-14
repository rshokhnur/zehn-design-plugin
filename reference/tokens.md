# zehn tokens cheat sheet

Files: `tokens/tokens.css` (CSS variables, light + dark + app accents), `tokens/tailwind.preset.cjs` (Tailwind theme: **replaces** colors, radius, font sizes/weights and shadows; **keeps** Tailwind's standard spacing keys), `tokens/tokens.json`, and `tokens/native/` (Swift, Dart, Kotlin).
All values come from Figma variables. Never hardcode a value that exists here. If something is missing, ask; don't invent.

## Setup in an app (once)
- Import `tokens.css` at the root.
- Tailwind: see the `setup-tokens` skill (CJS, ESM and v4 snippets).
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
| Disabled | `--zm-disabled-bg` / `--zm-disabled-fg` | `bg-disabled-bg text-disabled-fg` |
| Dialog backdrop (stays dark in dark mode) | `--zm-scrim` | `bg-scrim` |
| Notification counter (red) | `--zm-counter-bg` / `--zm-counter-fg` | `bg-counter-bg text-counter-fg` |
| Tooltip | `--zm-tooltip-bg` / `--zm-tooltip-fg` | `bg-tooltip-bg text-tooltip-fg` |
| Progress bar | `--zm-progress-track` / `--zm-progress-fill` | `bg-progress-track`, `bg-progress-fill` |
| Charts (in this order; 1–7 keep 3:1 contrast in both themes, 8 needs labels) | `--zm-chart-1..8`, `--zm-chart-positive`, `--zm-chart-negative`, `--zm-chart-grid`, `--zm-chart-axis` | `fill-chart-1`, `stroke-chart-1`… |

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

## Spacing
zehn values (px): 0 1 2 4 6 8 10 12 16 20 24 32 40 48 64 72 96 128.
Tailwind uses its **standard keys** (`p-4` = 16px, `gap-3` = 12px). Allowed keys for padding, margin, gap and space: `0 px 0.5 1 1.5 2 2.5 3 4 5 6 8 10 12 16 18 24 32`. Others (`p-7`, `mt-9`, `p-[13px]`) fail the style check.
Width and height can use any standard key (`h-8` 32, `h-10` 40, `h-14` 56) or the layout keys below.

## Radius
`rounded-sm` 2 · `rounded` 4 (web cards, panels, tables, banners, toasts, badges) · `rounded-lg` 8 (buttons, inputs, menus) · `rounded-xl` 12 · `rounded-2xl` 16 (mobile cards) · `rounded-3xl` 24 · `rounded-full`. No `rounded-md`.

## Shadows
`shadow-100` (cards), `shadow-200` (popovers, menus), `shadow-300` (modals, drawers), `shadow-mobile`, `shadow-focus` (focus ring). Tailwind's `shadow-sm/md/lg` don't exist.

## Layout constants (CSS var `--zm-<name>`, Tailwind `w-`/`h-`/`max-w-<name>`)
| Name | px | Use |
|---|---|---|
| `topbar-height` | 56 | top bar |
| `subbar-height` | 64 | builder sub-bar |
| `gutter` | 24 | page side padding (`px-6`) |
| `column-narrow` | 768 | feeds, settings: `max-w-column-narrow mx-auto` |
| `column-detail` | 896 | detail pages (560 `detail-main` + 16 + 320 `side-panel`) |
| `modal` / `modal-wide` / `modal-xl` | 520 / 600 / 904 | modals |
| `alert-dialog` | 520 | destructive confirm |
| `drawer` / `drawer-wide` | 520 / 640 | drawers (wide when it holds a table) |
| `header-icon` | 32 | page-header icon (box `w-header-icon h-header-icon`, Remix glyph `text-header-icon`) |
| `table-header` / `row` / `row-dense` | 36 / 48 / 36 | data tables |
| `chart-card` / `chart-plot` | 334 / 208 | dashboard chart card height / plot area |
| `toast` | 432 | toast width |
