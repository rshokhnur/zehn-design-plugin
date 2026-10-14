---
name: compose-screen
description: Build or change any zehn UI (screen, flow, modal, drawer, component, or styling) on the zehn design system, from a Figma link or composed from existing patterns when there is no design. Use for all frontend/UI work in zehn apps.
---

# Compose a screen the zehn way

You are building UI for a zehn app. Figma is the source of truth. Your job is to make the result look like the designer made it.

The full references are included BELOW this workflow:
- **REFERENCE: zehn UI/UX rules**: layout, screen types, patterns, forms, copy, formats
- **REFERENCE: zehn component catalog**: every component, its props, and the not-yet-componentized patterns
- **REFERENCE: zehn tokens cheat sheet**: which token or class to use for what

Important: the zehn Tailwind preset REPLACES Tailwind's defaults. Spacing keys are pixels (`p-16` = 16px, `p-6` = 6px), there are no `blue-500`-style colors, and radius is `rounded-4/8/12/16/full`.

## Step 1: Figure out the context
1. **Which app?** (procurement, hr, tasks, docs, edge, analytics, geo, intelligence, edu, desk). That sets `data-app` and the accent. If you can't tell, ask.
2. **Is there a Figma design?** Look for a figma.com link in the task, ticket or PR description.
3. **Platform:** web (1440 desktop) or mobile (edu/desk, 402 iOS).

## Step 2a: With a Figma link
1. Use the Figma MCP (`get_design_context`, `get_screenshot`, `get_variable_defs`) on the exact node.
2. Treat the generated code as a **reference only**. Map every element to an existing component (catalog below) and every value to a token (cheat sheet below). Never paste raw styles from it.
3. Where the Figma frame and the rules differ (e.g. an old screen with a blue primary button), the **rules win**. Note the difference in your final message.

## Step 2b: No design (compose from patterns)
1. Pick the screen type from the table in the UI/UX rules §3 (table list, card feed, detail, modal, drawer, builder, board, dashboard, empty).
2. Find the closest existing screen in the codebase that already follows these rules, and reuse its layout and shared components.
3. Compose ONLY from existing components and the patterns in the component catalog ("Not yet library components"). Build a missing pattern once as a shared component; never inline it.
4. Copy: sentence case, short, friendly, second person. Formats: `30.06.2026`, `30.06.2026 14:27`, `24,000,000 UZS`, `#REQ-3`, ` · ` separators.
5. Design every state, not just the happy path: empty, loading (skeleton / Button loading), validation error, success toast, permission-denied (disabled + reason), and a destructive confirm.

## Step 3: Checklist before you finish
- [ ] No hex/rgb, no default Tailwind palette, no arbitrary `[...]` values. Only `--zm-*` tokens or zehn preset classes.
- [ ] Only existing components; no new button, badge or input variants.
- [ ] Shell: 56px top bar with ghost tabs, page header with the accent bar and icon, correct content width (full width for tables/dashboards, 768 for feeds/settings, 896 for detail).
- [ ] One primary (black) button per view, placed last on the right.
- [ ] Status badges are tinted with an icon and use the status color meaning, never the app accent.
- [ ] Forms: labels above, red `*` for required, errors under the field, Cancel + primary in the footer.
- [ ] Destructive actions open an Alert Dialog.
- [ ] Works in dark mode (`data-theme="dark"`).
- [ ] Inter 400/600 only; Remix `-line` icons.

## Step 4: Report design gaps
If there was no Figma design, end your message with a short **Design gaps** list: every decision you made that the rules didn't cover (new pattern, unclear copy, missing state), so the designer can review. If you had to keep a value with `zehn-ignore`, list it there too.

## If the codebase has no tokens yet
Run the `setup-tokens` skill first.


---

# REFERENCE: zehn UI/UX rules

Source: ~250 screens in the zehnmind Figma file (procurement, hr, tasks, docs, edge, analytics, geo, intelligence, edu, desk).
Excluded: meet, office (explorations), plus old and client pages.
Only this file's styles and components count. Ignore any remote library copies.
Items still open are marked **[open]**.

---

## 0. Product family

zehn is one platform with many apps. All apps share one shell, one component library and one token set.
Each app has **one accent color**, used ONLY for:
1. the app name in the logo (`zehn` + `/app`)
2. the 2px bar left of the page title
3. the 32px page-header icon
4. the highlighted (first) stat card tint

The accent is **never** used on primary buttons, body text or status badges.

| App | Accent token |
|---|---|
| procurement | `Cyan` |
| intelligence | `Cyan` |
| desk | `Cyan` |
| hr | `Orange` |
| tasks | `Orange` |
| analytics | `Orange` |
| edge | `Orange` **[open]**: the edge logo currently says "tasks", so confirm |
| docs | `Blue` |
| geo | `Yellow-Green` |
| edu | `Edu Green` (official sub-brand; needs new variables, see §9) |

## 1. Foundations

- **Font:** Inter only, through the text styles `text-{xxs…7xl}-{size}pt/{regular|semibold}`. Weights are 400 and 600 only. Letter spacing is -1%.
- **Icons:** Remix Icon, `-line` style. 16–20px inline, 32px in page headers.
- **Color:** variables from the `Colors` collection only. No hex, rgb or named colors. Light and Dark must both work.
- **Spacing:** `Spacing/*` only: 0, 1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64, 72, 96, 128.
- **Radius:** `Border Radius/*`: 0, 2, 4, 8, 12, 16, 24, 32, full.
- **Shadows:** `Drop Shadow/100|200|300|Mobile`. Focus ring is `Focus/Accent`.
- **Primary action:** always `Action/Background` (black in light, white in dark), in **every app**, including docs, geo and edu.

## 2. Desktop shell (all web apps)

- **Top bar, 56px,** white, with a 1px bottom border.
  - Left: logo `zehn` + `/app` in the accent, then a 1×16 divider, then nav as **ghost tabs** (`Button` Ghost, icon + label). The active tab gets a gray fill.
  - Right: bell `Icon Button` + red `Counter`, a divider, a ghost "Support" button and the avatar.
  - No sidebars. geo moves to this top bar. No Segmented Control as navigation (tasks moves to ghost tabs).
- **Header Pattern** sits behind the top-right of list and overview pages.
- **Page header:** 2px accent bar, 32px accent icon, H1 `text-2xl/semibold`, a gray subtitle with live counts ("1 request waiting on you"). Actions on the right, with the primary (black) last.
- **Detail header:** a back icon-button or `< All {items}` link, `#ID` (`text-xs`, gray), the title, then a meta row (avatar + name · Submitted 01.06.2026 · Needed by 30.06.2026 (in 28 days)). A `…` menu on the right and a divider below.
- **Content width:**
  - **Full width, 24px gutters** (1392 at 1440): tables, dashboards, boards, builders.
  - **Centered 768px column:** card feeds, inboxes, settings, simple lists.
  - **Centered 896px detail:** 560 main + 16 gap + 320 side column of panel cards.

## 3. Screen types

| Type | Recipe |
|---|---|
| Table list | page header → optional stat-card row (3–5, first card accent-tinted) → toolbar (filter chips or Segmented Control for views, search, filter selects, pager `< 1 / 45 >`) → full-width data table |
| Card feed | page header → search → filter chips → cards (768 column) |
| Detail | detail header → 560 main + 320 side panels (Details, People, Activity) |
| Short create/edit (≤ ~8 fields) | **520px centered modal** |
| Long or multi-step create/edit | **520px right drawer**, full height, with a stepper if multi-step. 640px when it holds a table. |
| Big object with repeated sub-items | full page (e.g. procurement New Request) |
| Builder | 64px sub-bar (Back, title, Preview, Publish) + 240 palette + canvas + 320 inspector |
| Board | kanban columns of `Task Card` |
| Dashboard | grid of chart cards and stat tiles |
| Empty | keep the header, search and filters; `Empty State` centered with a title, one line and an optional small button |

**Modal/drawer shell:** header ~64px (tinted icon + title + subtitle + close ✕). Body fields 16px apart, grouped by section headings. Sticky 56px footer, right-aligned: `Secondary` Cancel, then `Primary` action.
Modal widths: 520 (default), 600, 904 (two-column).

## 4. Components

Use library components first. Never rebuild a Button, Badge, Input, Avatar, Menu, Toast or Empty State.

- **Button styles:**
  - `Primary`: the main action, one per view.
  - `Secondary`: Cancel and other actions.
  - `Ghost`: nav tabs and toolbar text actions.
  - Small `Secondary` + icon: inline actions ("+ Add", "Delete").
  - `Destructive - Primary`: confirming a destructive action inside a confirm dialog.
  - `Destructive - Secondary`: Reject.
  - `Color - Primary` (green): Approve only.
  - `AI - Primary` / `AI - Secondary`: AI actions only.
- **Badge (status):** Style=Tinted, always with an icon. Never use the app accent.

| Meaning | Color | Examples |
|---|---|---|
| done / active / approved / online | Green | Approved, Active, Completed, Online |
| waiting | Orange | Pending, On vacation, Deploying |
| in progress / info | Blue | In review, Running, Business trip |
| failed / rejected / urgent | Red | Rejected, Offline, Failed, High priority |
| inactive / neutral | Neutral | Paused, Planned, Stopped, Withdrawn, Private |
| special | Violet / Coral / Pink | Admin, Maternity leave, E-IMZO |

  Priority: High = red flag + red text. Normal shows nothing.
- **Filter chips:** `Button` Small. Active = Primary, inactive = Secondary. Counts use `Counter`.
- **Data table** (pattern until it's a component): gray 36px header row, 36 or 48px rows, bold first column, status Badge column, and a `…` row menu (Edit, then a divider, then red Delete).
- **Stat card:** label, big number, optional delta.
- **Side panel card:** icon + title header; label (gray, left) and value (right) rows.
- **Info chip under a field:** tinted 12px chip with an icon ("Available balance: 21 days").
- **People:** `Avatar` (initials) + full name. `Avatar (Grouped)` for teams.
- **Menu:** `Menu`. The destructive item goes last, red, after a divider.
- **Activity:** circle icon + **Name** action + timestamp.
- **Toast:** after save, copy or send. Success / Error types. An optional action ("View").
- **Charts:** colors from variables (positive `Cyan`, negative `Coral`, series in Cyan → Blue → Violet → Pink → Orange → Yellow-Green). They must be readable in Dark. An empty-data widget shows a gray outline of its chart type.
- **Tabs inside a page:** `Segmented Control` (views and sections). No underline tabs.

## 5. Forms and behavior

- The label goes above the field. Required fields get a red `*`. Don't also write "(optional)". If most fields are optional, mark only the required ones.
- Group fields with section headings (16px icon + label) and dividers.
- Helper text and info chips go under the field. Placeholders are realistic examples ("e.g. Macbook Pro M5 for new design hire").
- Validation: `Input` State=Error + a red hint under the field, shown on blur and on submit. Focus the first error.
- Loading: `Button` State=Loading; skeleton rows for tables and cards.
- Success: `Toast` Success. Failure: `Toast` Error with retry.
- **Confirm dialog (`Alert Dialog`) before every destructive action:** delete, terminate, withdraw, reject, stop, end session, log out of other devices. The title names the action and the object ("Withdraw request #REQ-3?"); one line says the consequence; buttons are Cancel + `Destructive - Primary` with the action verb.
- Prefer Archive over Delete for user content.
- **Permissions stay visible:** disabled actions explain why ("Only the owner can close this board."). Read-only viewers see a yellow "View-only access" banner. If the viewer must act, show a tinted role banner at the top (procurement approver).

## 6. Mobile (edu, desk)

- 402px iOS frames, with the `Status Bar` + `Home Indicator` components. 16px side margins. Cards use radius 16.
- Tab screens use a large title (`text-3xl/semibold` or `text-2xl/semibold`). Pushed screens use a 42px round back button + `text-xl/semibold` title.
- Tab bar: floating 386×64 pill (to become a component).
- Primary CTA: full-width, fixed to the bottom, black.
- Bottom sheets: ✕ to cancel, ✓ to save.
- Empty cards are dashed, with a reload button. Full-screen No internet / 500 error states have retry.
- Dark mode is required.

## 7. AI

- In-app AI actions use `AI - Primary` / `AI - Secondary` (pink), the `AI Gradient` wash on AI modal headers, and a sparkle icon.
- The zehn intelligence assistant uses the orb (default / listening / thinking states), a 64px launcher bottom-right, and cyan send + chat bubbles. Don't use the orb anywhere else.

## 8. Copy and formatting

- **Sentence case** everywhere: buttons, titles, tabs, menus ("Create board", "New request", "Submit for approval").
- **Dates:** `30.06.2026`. Date-time: `30.06.2026 14:27` (24h). Ranges: `12.01.2026 – 31.01.2026 · 10 days`. Add relative time next to deadlines: "(in 28 days)".
- **Money:** `24,000,000 UZS` (currency after, comma thousands). Ranges: `24,000,000 – 31,999,999 UZS`.
- **Durations:** `14d 3h 22m`.
- **IDs:** `#REQ-3`.
- **Meta separator:** ` · `.
- **Tone:** short, friendly, second person ("Your requests", "Tell us what you need.").
- **Language:** web English; edu Uzbek (Latin, use `‘` in o‘/g‘); desk English. **[open]** Will web apps get uz/ru?
- No placeholder, joke or real-person data in shipped UI. Spell-check all strings.

## 9. Token gaps to add in Figma (designer)

- `Edu Green/default #21aa31`, `/darker #038c17`, `/deep #005c3d` (+ stroke/fill-1/fill-2, Light & Dark). edu uses these as raw hex today.
- geo: bind the raw `#7eaf30` to `Yellow-Green/default`.
- Semantic layer (the plugin already ships these as aliases): `text/primary`, `text/secondary`, `text/tertiary`, `border/default`, `bg/base`, `bg/subtle`, `status/*`, `app/accent`.


---

# REFERENCE: zehn component catalog

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


---

# REFERENCE: zehn tokens cheat sheet

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
