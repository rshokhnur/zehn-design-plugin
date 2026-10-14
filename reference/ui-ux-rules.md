# zehn UI/UX rules

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
- **Charts:** use `--zm-chart-1…8` in order (Cyan → Blue → Violet → Pink → Coral → Yellow-Green → Teal → Orange; the light theme uses the darker shades so lines and bars keep 3:1 contrast). Positive `--zm-chart-positive`, negative `--zm-chart-negative`, grid and axis tokens. Never use raw hues for charts. They must be readable in Dark. An empty-data widget shows a gray outline of its chart type. **[open]** Chart card heights aren't specified in Figma yet; reuse the nearest existing dashboard and list it as a design gap.
- **Tooltip:** dark (`--zm-tooltip-bg`), `text-xs`, radius 4, max one short sentence. Shows on hover and keyboard focus. Use it to explain an icon-only control or a truncated value, never for essential info.
- **Progress bar:** 4px track `--zm-progress-track`, fill `--zm-progress-fill` (status color only when it means something), with a label or percentage next to it.
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

## 5a. Accessibility (baseline, zehn rules win on visuals)

- Dialogs and drawers trap focus, close on Escape, and return focus to the button that opened them. Alert Dialog focuses Cancel first.
- Menus: arrow keys, Home/End, Escape returns focus to the trigger. Segmented Control: arrow keys.
- Toasts pause while hovered or focused. Errors use `role="alert"`.
- Icon-only buttons need an `aria-label`. Inputs wire their label and hints (`aria-describedby`, `aria-invalid`).
- Loading keeps the button's own color (a red button stays red) and sets `aria-busy`.
- Animations (`animate-spin`, `animate-pulse`, transitions) go behind `motion-safe:`.
- zehn sizes stay as designed (32px medium buttons on web, not 44px); mobile tap targets are at least 44px.

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

## 8a. When someone asks for something off-system

1. Say in one line which rule it breaks and offer the zehn alternative.
2. If they still want it, do it, with `zehn-ignore: requested by <who>, <why>` on every line that uses the value (not one shared constant).
3. List each override under **Design gaps** in the final message. Never comply silently.

## 9. Token gaps to add in Figma (designer)

- `Edu Green/default #21aa31`, `/darker #038c17`, `/deep #005c3d` (+ stroke/fill-1/fill-2, Light & Dark). edu uses these as raw hex today.
- geo: bind the raw `#7eaf30` to `Yellow-Green/default`.
- Semantic layer (the plugin already ships these as aliases): `text/primary`, `text/secondary`, `text/tertiary`, `border/default`, `bg/base`, `bg/subtle`, `status/*`, `app/accent`.
