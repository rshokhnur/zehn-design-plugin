# zehn component catalog

Source: Figma page `UI Elements` in file ywFHunM35gYeHJozrBJpZO. Props mirror Figma exactly.
**Rule:** if the codebase already has a component with this name, use it. If not, build it ONCE in the shared UI folder with these exact props, then reuse it. Never create one-off variants inline.

## Actions

### Button
| Prop | Values |
|---|---|
| size | `large` (40px) · `medium` (32px, default) · `small` (24px) |
| style | `primary` · `secondary` · `ghost` · `color-primary` · `color-secondary` · `ai-primary` · `ai-secondary` · `destructive-primary` · `destructive-secondary` |
| state | default · hover · focus · loading · disabled |
| slots | `label`, `leftIcon`, `rightIcon`, `counter` |

What each style is for:
- **primary:** black (`--zm-primary-bg`). The main action, at most one per view.
- **secondary:** gray fill. Cancel and other actions. Small + icon for inline actions ("+ Add").
- **ghost:** nav tabs and quiet toolbar actions.
- **color-primary:** green. Approve only.
- **color-secondary:** tinted green.
- **ai-primary / ai-secondary:** pink. AI actions only, with a sparkle icon.
- **destructive-primary:** red. The confirm button inside a destructive confirm dialog.
- **destructive-secondary:** tinted red. Reject or Withdraw buttons that open a confirm.
- **loading:** shows a spinner and keeps the width.

### Icon Button
Same `size`, `style` and `state` as Button, with a single `icon`. Used for back, close, `…` menus, bell and toolbars. A ghost icon button needs an `aria-label`.

### Counter
| Prop | Values |
|---|---|
| size | small · medium · large |
| style | tinted · filled |
| color | neutral · white · accent |

Used for counts in chips, tabs and the notification bell (filled red).

## Display

### Badge
| Prop | Values |
|---|---|
| size | small · medium |
| style | tinted (default for status) · filled · ghost |
| color | neutral · accent · red · green · peach · teal · yellow · coral · pink · blue · violet |
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

## Mobile only
`Status Bar - iPhone Dynamic Island`, `Home Indicator` (Figma frames only, not built in code).

## Not yet library components (build once as shared components, following these specs)

| Pattern | Spec |
|---|---|
| **TopBar** | 56px, bottom border `--zm-border-default`. Left: logo `zehn` + `/app` in `--zm-app-accent`, a 1×16 divider, Ghost nav tabs (active = `--zm-surface-subtle` fill). Right: bell IconButton + red Counter, divider, Ghost "Support", Avatar 32. |
| **PageHeader** | 2px × 40px bar in `--zm-app-accent`, 32px accent icon, H1 `text-2xl semibold`, subtitle `text-sm` secondary. Actions on the right, primary last. |
| **DetailHeader** | back IconButton or "< All {items}" link, `#ID` (xs, secondary), title (2xl semibold), meta row joined with ` · `, `…` IconButton on the right, divider below. |
| **StatCard** | 288×96. Label (sm, secondary), value (2xl semibold), optional delta Badge. The first card in a row uses `--zm-app-accent-fill` with an accent label. |
| **DataTable** | header row 36px on `--zm-surface-subtle`, `text-xs semibold` secondary. Rows 48px (36 when dense), 1px bottom border. First column bold. Status column = Badge. Last column = `…` IconButton → Menu (Edit, divider, red Delete). The pager `< 1 / 45 >` sits in the toolbar. |
| **Toolbar** | one row, 12px gap: Segmented Control or filter chips · search Input (flex) · filter Selects · pager. |
| **FilterChips** | small Buttons. Active = primary, inactive = secondary, with a Counter. |
| **PanelCard** | 1px border, radius 8, padding 16. Header: 16px icon + title (sm, secondary). Rows: label (secondary) left, value right, 12px apart. |
| **ModalShell** | width 520 (600 or 904). Header 64px: tinted icon + title + subtitle + close. Body padding 24 with 16px field gap. Footer 56px sticky, right-aligned: Cancel (secondary) + primary. |
| **DrawerShell** | same anatomy as ModalShell, full-height right side, 520px (640 when it holds a table). Add a stepper under the header for multi-step. |
| **InfoChip** | tinted 12px chip with an icon, under a field. |
| **ActivityItem** | 32px circle icon on a vertical rule, **Name** + action (sm), timestamp (xs, secondary). |
| **TaskCard / BoardCard** | exist in Figma on the tasks page (Task Card 264×131 with a 2px top accent; Board Card 389×117). Follow them. |
| **RoleBanner** | tinted (`--zm-app-accent-fill` or `--zm-cyan-fill-2`) box, radius 8, padding 16. Title (base semibold) + one line + action buttons. |
| **MobileTabBar** | floating 386×64 pill, 5 items max, an icon + label per item, active = accent. |
