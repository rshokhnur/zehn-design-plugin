# zehn component catalog

Source: Figma page `UI Elements` in file ywFHunM35gYeHJozrBJpZO. Props mirror Figma.
**Rule:** use the shared zehn components in `src/components/zehn/`. If the app doesn't have them, copy them in from the plugin's `components/react/` (the `setup-tokens` skill does this). Never rebuild one, and never create one-off variants inline. Non-React stacks: build each one ONCE in the shared UI folder with these exact props.
In code, Figma's `style` property is the prop **`variant`** (`style` is reserved by React).

## Actions

### Button
| Prop | Values |
|---|---|
| size | `large` (40px) · `medium` (32px, default) · `small` (24px) |
| variant | `primary` · `secondary` · `ghost` · `color-primary` · `color-secondary` · `ai-primary` · `ai-secondary` · `destructive-primary` · `destructive-secondary` |
| state | default · hover · focus · loading · disabled |
| slots | `label`, `leftIcon`, `rightIcon`, `counter` |

What each variant is for:
- **primary:** black (`--zm-primary-bg`). The main action, at most one per view.
- **secondary:** gray fill. Cancel and other actions. Small + icon for inline actions ("+ Add").
- **ghost:** nav tabs and quiet toolbar actions.
- **color-primary:** green. Approve only.
- **color-secondary:** tinted green.
- **ai-primary / ai-secondary:** pink. AI actions only, with a sparkle icon.
- **destructive-primary:** red. The confirm button inside a destructive confirm dialog.
- **destructive-secondary:** tinted red. Reject or Withdraw buttons that open a confirm.
- **loading:** shows a spinner, keeps the width and the variant's color (a red button stays red), sets `aria-busy`.

### Icon Button
Same `size`, `variant` and `state` as Button, with a single `icon`. Used for back, close, `…` menus, bell and toolbars. A ghost icon button needs an `aria-label`.

### Counter
| Prop | Values |
|---|---|
| size | small · medium · large |
| tone | tinted · filled |
| color | neutral · white · accent · red |

Used for counts in chips, tabs and the notification bell (filled red: `bg-counter-bg text-counter-fg`).

## Display

### Badge
| Prop | Values |
|---|---|
| size | small · medium |
| appearance | tinted (default for status) · filled · ghost |
| color | neutral · red · green · peach · teal · yellow · coral · pink · blue · violet |
| status (shortcut) | success · warning · info · danger · neutral (sets color + icon) |

`peach` uses the Orange hue and `yellow` the Lime hue. Figma also has an `accent` badge color; don't use it (the accent is reserved for the logo, header and first stat card).
| slots | `label`, `leftIcon`, `rightIcon` |

Status mapping (always tinted, with an icon):

| Meaning | Color | Icon examples |
|---|---|---|
| success | green | check, pulse |
| warning | yellow or peach (orange) | clock, sun |
| info | blue | glasses, plane, loader |
| danger | red | close, alert, stethoscope |
| neutral | neutral | pause, archive |

### Avatar
| Prop | Values |
|---|---|
| type | placeholder · image · name (initials) · icon |
| size | 16 · 20 · 24 · 32 · 48 · 64 · 96 · 128 |
| flags | `status` (online dot), `counter` |

Always pair an Avatar with the full name in lists. Initials avatars are tinted.

### Avatar (Grouped)
Stacked avatars + a "+N" counter. Sizes 16–48.

### Empty State
A 256px illustration block (icon with a soft glow) + `icon` slot + `blur` flag. Put a title and one line of copy under it, plus an optional small button.

### Header Pattern
A decorative wireframe swirl with a cyan/lime blur. Place it absolutely at the top-right of list/overview pages, behind the content (`pointer-events: none`).

### AI Gradient
A pink/violet wash, used behind AI modal headers and AI panels only.

## Inputs

### Input & Select
| Prop | Values |
|---|---|
| size | medium (32) · large (40) |
| state | default · filled · focused · error · disabled |
| slots | `label`, `required` (*), `topHint`, `bottomHint` (+ icons), `leftIcon`, `rightIcon` |

- Use it for text, search (left search icon) and selects (right chevron).
- **error:** red border + a red bottom hint with an icon.

### Text Area
Same props as Input, without icons. Shows a `0/200` counter when the text has a limit.

### Multi-select Field
Same props as Input. Selected items show as chips.

### OTP Input
| Prop | Values |
|---|---|
| size | small · medium · large · mega |
| flags | `dot` (masked) |

### Checkbox
State: unchecked · checked · indeterminate · disabled · disabled checked.

### Radio Button
State: unchecked · checked · disabled · disabled checked.

### Switch
| Prop | Values |
|---|---|
| size | medium · small |
| state | off · on · disabled on · disabled off |

## Navigation

### Segmented Control
| Prop | Values |
|---|---|
| size | small · medium · large |
| items | 2–5 |

Each item has a label, optional icons and a counter. Use it for **in-page views and sections only**, never for app navigation.

### Breadcrumbs
| Prop | Values |
|---|---|
| size | small · tiny |
| flags | `chevronDivider` |

Use only in deep hierarchies (project → board → task).

### Menu
Rows are one-line or two-line.
- Left add-on: label · avatar · checkbox · icon · image · radio · switch · icon badge.
- Right add-on: badge · text · icon · counter · button · switch…

Rules:
- Destructive item last, red, after a divider.
- A small gray explanatory note is allowed at the bottom.

## Feedback

### Toast
| Prop | Values |
|---|---|
| type | default · info · loading · success · warning · error |
| slots | `title`, `subtitle`, `button`, `close` |

Show a toast after save, copy or send. Errors include a retry action.

### Alert Dialog
Slots: `icon`, `title`, `subtitle`. Used for **every destructive confirm**:
- Title: "Delete board "Mobile app"?"
- Subtitle: one line on the consequence.
- Buttons: `secondary` Cancel + `destructive-primary` with the verb.

### Tooltip
Dark (`bg-tooltip-bg text-tooltip-fg`), `text-xs`, radius 4, padding 4×8, `shadow-200`. Opens on hover and keyboard focus, closes on Escape. One short sentence. Explains icon-only controls, truncated values and disabled actions ("Only the owner can close this board.").

### Progress Bar
4px track (`bg-progress-track`), fill `bg-progress-fill` (a status color only when it means something), radius full, with a label or percentage beside it. `role="progressbar"`.

### Skeleton
`bg-surface-subtle`, radius 4 (8 for cards), `motion-safe:animate-pulse`. Match the shape of the content it replaces.

## Mobile only
`Status Bar - iPhone Dynamic Island`, `Home Indicator` (Figma frames only, not built in code).

## Patterns (not Figma components yet; React versions ship in `components/react/`)

| Pattern | Spec |
|---|---|
| **TopBar** | 56px, bottom border `--zm-border-default`. Left: logo `zehn` + `/app` in `--zm-app-accent`, a 1×16 divider, Ghost nav tabs (active = `--zm-surface-subtle` fill). Right: bell IconButton + red Counter, divider, Ghost "Support", Avatar 32. |
| **PageHeader** | 2px × 40px bar in `--zm-app-accent`, 32px accent icon, H1 `text-2xl semibold`, subtitle `text-sm` secondary. Actions on the right, primary last. |
| **DetailHeader** | back IconButton or "< All {items}" link, `#ID` (xs, secondary), title (2xl semibold), meta row joined with ` · `, `…` IconButton on the right, divider below. |
| **StatCard** | 288×96 (in a dashboard grid: equal columns, 16px gap). Label (sm, secondary), value (2xl semibold), optional delta Badge. The first card in a row uses `--zm-app-accent-fill` with an accent label. |
| **DataTable** | header row 36px on `--zm-surface-subtle`, `text-xs semibold` secondary. Rows 48px (36 when dense), 1px bottom border. First column bold. Status column = Badge. Last column = `…` IconButton → Menu (Edit, divider, red Delete). The pager `< 1 / 45 >` sits in the toolbar. |
| **Toolbar** | one row, 12px gap: Segmented Control or filter chips · search Input (flex) · filter Selects · pager. |
| **FilterChips** | small Buttons. Active = primary, inactive = secondary, with a Counter. |
| **PanelCard** | 1px border, radius 8, padding 16. Header: 16px icon + title (sm, secondary). Rows: label (secondary) left, value right, 12px apart. |
| **ModalShell** (`Modal`) | width 520 (600 or 904). Backdrop `bg-scrim` (stays dark in dark mode). Header 64px: tinted icon + title + subtitle + close. Body padding 24 with 16px field gap. Footer 56px sticky, right-aligned: Cancel (secondary) + primary. Focus trap, Escape closes, focus returns to the opener. |
| **DrawerShell** (`Drawer`) | same anatomy as ModalShell, full-height right side, 520px (640 when it holds a table). Add a stepper under the header for multi-step. |
| **InfoChip** | tinted 12px chip with an icon, under a field. |
| **ActivityItem** | 32px circle icon on a vertical rule, **Name** + action (sm), timestamp (xs, secondary). |
| **TaskCard / BoardCard** | exist in Figma on the tasks page (Task Card 264×131 with a 2px top accent; Board Card 389×117). Follow them. |
| **RoleBanner** | tinted (`--zm-app-accent-fill` or `--zm-cyan-fill-2`) box, radius 8, padding 16. Title (base semibold) + one line + action buttons. |
| **MobileTabBar** | floating 386×64 pill, 5 items max, an icon + label per item, active = accent. |
