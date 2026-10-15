---
name: compose-screen
description: Build a new zehn screen, page, flow, modal or drawer, or restructure an existing layout, from a Figma link or composed from patterns. Holds the full rules, component catalog and tokens; works through the app's own components via zehn.project.json. For edits that keep the current layout (a button, column, field, badge, copy, spacing) use ui-tweak. To review a PR or migrate an old page to zehn use ui-review.
---

# Compose a screen the zehn way

You are building UI for a zehn app. Make the result look like the designer made it.

Wrong skill? If the change adds no screen, modal, drawer or flow and keeps the current layout, use `ui-tweak`. Migrating an old page to zehn: `ui-review`.

The references below this workflow:
- **REFERENCE: zehn UI/UX rules**: who wins, layout, screen types, forms, copy and formats, off-system requests
- **REFERENCE: zehn component catalog**: what ships, the real props, and what to build
- **REFERENCE: zehn tokens cheat sheet**: which token or class to use for what

Animation work: load the `motion` skill too.

When sources disagree, follow "Who wins" at the top of the rules. When unsure, follow Figma.

## Step 1: Context
1. **Read `zehn.project.json`** at the app root: the components, tokens and example screens to use. Missing → run `setup-project` before anything else.
2. **Which app?** `app` in `zehn.project.json`, else the repo's `data-app`. It sets the accent. Still unclear: ask the developer (rules, "Ask the developer"). Read `decisions` there too: forks already answered.
3. **Figma design?** Look for a figma.com link in the task, ticket or PR description.
4. **Platform:** web (1440 desktop) or mobile (edu, desk: 402 iOS).

## Step 2a: With a Figma link
0. **A big link** (a page, a section, or a frame with many screens): don't pull the whole thing. Call `get_metadata` on it, list its top-level frames (name and node id), and ask the developer which ones to build (one question, options = frame groups, the core flow recommended). Save the answer under `decisions`. Then read only those frames, one at a time.
1. Load figma:figma-design-to-code as it requires, then read the exact node (`get_design_context`, `get_screenshot`). Where that skill conflicts with this one, this one wins: no downloaded icons, header art or component images (use the app's icon set and mapped components, and `HeaderPattern` where the app has no header art), and no generated styles (map every value to the project's token through `tokens.figmaMap`). Why: downloaded assets are frozen copies that don't follow dark mode, the app accent or later redesigns. Download only real photos or illustrations that exist nowhere else.
2. Treat the generated code as a reference only. Map each element to a mapped component and each value to a project token. Never paste raw styles.
3. Copy the page structure of the example screen mapped for this screen type (`screens`) and fill it with the frame's content. Build what the frame shows for this task; frames often show extra states or actions, so ask or list them under Suggestions before building them.
4. A value in the frame differs from the rules or a mapped component → apply "Who wins" and add the Design gaps line.

## Step 2b: No design
1. Look at the sibling screens in this app first. Then pick the screen type, the create/edit container (rules §3) and the content width (rules §2) as defaults where the siblings don't decide.
2. Copy the layout of the example screen mapped for that type (`screens` in `zehn.project.json`), or the closest existing screen. Match the sibling screens: their shell, header, cards or list, and widths come first. The zehn recipes are defaults; deviate when the content or the developer calls for it, with a `Layout: <what>, <why>` line under Design gaps.
3. Use the components mapped in `zehn.project.json` first (their names, imports and props), then the zehn fallback components (`fallback.zehnDir`), then build from the catalog spec with the app's primitives. List the mapping's `gaps` for each component you use under Design gaps. Never invent a component, variant or style; if one is truly needed, build it once from their primitives in their style (catalog intro) and list it.
4. A real fork the siblings and Figma don't settle (container, cards or table, a missing component: build or reuse)? Ask the developer once, recommended option first, and save the answer under `decisions`.
5. Design every state of what was asked: empty, loading (Skeleton, Button `loading`), validation error, success toast, permission (`disabledReason`), destructive confirm. States, yes; new features, no: extra actions, filters, stats or statuses go under Suggestions (rules, project map 5).
6. Motion: only what the mapped components already do, plus the `motion` skill patterns where something opens, closes or changes. Page navigation is instant.

## Step 3: Before you finish
The zehn style check runs after every edit and again before you finish (Bash and sed edits included). Fix every line it reports, or mark a user request per rules §8a. Don't finish while it reports issues.
- [ ] Only the project's tokens; no hex, unlisted Tailwind colors or arbitrary `[...]` values.
- [ ] Only mapped (or fallback) components; no new component, variant or style. The layout matches the mapped example screen and its siblings.
- [ ] Only what was asked; shared components untouched (or listed as a design-system change). Ideas under Suggestions.
- [ ] Layout fits the app: same shell, header and width as the sibling screens (zehn recipes where there are none). Any deliberate difference has a `Layout:` line under Design gaps.
- [ ] One primary per surface (rules §4). Accent only in the rules §0 list.
- [ ] Badges use `status` by meaning. Destructive actions open an AlertDialog.
- [ ] Copy and formats per rules §8, through the app's formatters (or zehn's `format*`) with the locale.
- [ ] Works in dark mode. Motion follows the `motion` skill and has a reduced-motion path.

## Off-system requests
Follow rules §8a exactly, including for sed, scripts and codemods.

## Step 4: Design gaps
Always end with **Design gaps** (plus **Suggestions** if you had ideas beyond the ask): every decision the rules didn't cover, every place a lower source lost (`<element>: Figma <value>, used <value> (why)`), every component you built from the catalog, and every `zehn-ignore` (what, who asked, why). Write "Design gaps: none" if there are none.


---

# REFERENCE: zehn UI/UX rules

When reading Figma, use only the styles and components local to file `ywFHunM35gYeHJozrBJpZO` (zehnmind). Ignore remote library copies.

## The project map

zehn is a guardrails layer over the app's own design system. `zehn.project.json` at the app root (written by setup-project) maps the app's tokens, components and example screens to the Figma variables and this catalog. For every UI change:

1. Read `zehn.project.json`.
2. Use its mapped components (their names, imports and props) and its tokens (`tokens.sources`, `tailwindColors`; Figma variables through `tokens.figmaMap`).
3. Copy the layout of the example screen mapped for the screen type (`screens`), or the closest existing screen.
4. Never invent a component, variant or style. If one is truly needed, build it from their existing primitives in their style and list it under Design gaps.
5. **Build only what was asked.** No extra actions, filters, stats, pagers, statuses or chips on neighbouring screens. Ideas go under **Suggestions** in your message, not in the code. Keep the data meaning the user gave you (withdraw sets a status, it doesn't delete). Why: the designer and the team decide scope; extra UI is drift too.
6. **Don't edit the shared components** (`components.dir` and the mapped imports) **or the theme** (token files, Tailwind config) to restyle one screen. Never add a token to hold a one-off value. A change there changes every screen: only when the user asked for it, and list it under Design gaps as "design-system change, designer sign-off needed". The style check flags every edit there.

zehn class names and `--zm-*` tokens in these rules describe the zehn fallback (used when `fallback.zehnTokens` is true). In an app with its own tokens, read them as "the project's token for this Figma variable". The rules themselves (widths, order, which element gets which radius, formats) apply either way.

## Rules vs layout defaults

Two kinds of rules live here:
- **Hard rules (always):** the project's tokens and styling (color, radius, type, shadow, spacing, motion), its mapped components and nothing invented, primary always black, the accent list (§0), copy and formats (§8), a confirm before destructive actions (§5), accessibility (§5a). The style check enforces most of these.
- **Layout defaults (adapt to context):** the shell (top bar or sidebar), page and detail headers, HeaderPattern, stat-card rows, cards vs list vs table, content widths, modal vs drawer, screen recipes (§2, §3). Follow the app's existing screens first, then the Figma frames for that app, then these defaults. Deviate when the content calls for it (a settings area with many sections, a dense ops tool, an embedded widget) or the developer asks: no pushback, no `zehn-ignore`, just one `Layout: <what>, <why>` line under Design gaps. Keep every real navigation item; never drop items to fit a pattern.

## Ask the developer at real forks

When the work forks and nothing here decides it, ask the developer in the session instead of guessing: one question with 2–4 short options and your recommended pick first (Claude Code's AskUserQuestion tool; in other agents a short question). Ask only at these forks:
1. **An app with no accent** (a module not in §0, e.g. anbar, abat): which accent. Asked once in setup-project.
2. **A big Figma link** (a page or section with many frames): which frames to build.
3. **A layout fork** with no sibling screen and no Figma frame to follow (e.g. modal or drawer, table or cards).
4. **A component the library lacks:** build it once from their pieces, or reuse the closest existing one.
5. **Several equally good mappings** in setup-project (two Button components, two token files).

Don't ask about anything the rules, the siblings or Figma already decide, or about small details: pick and list them under Design gaps. Save each answer in `zehn.project.json` under `decisions` (e.g. `"decisions": { "date-range picker": "reuse Select with presets" }`; the accent goes in `app`), so nobody is asked twice. Read `decisions` before asking. If the developer can't be asked (a headless run), take the recommended option and list it under Design gaps.

## Who wins

When two sources disagree on anything (a value, a component, a layout), walk this list from the top and stop at the first one that decides:

1. **An explicit request from the user in this session.** Only through the off-system protocol (§8a): one-line note, then `zehn-ignore` on each line, then Design gaps.
2. **The hard rules** (above): the project's tokens and styling, mapped components, primary always black, the accent list (§0), sentence case, date and money formats (§8), Alert Dialog before destructive actions (§5). Why: these were decided on purpose and beat old Figma frames. Layout is not on this list; it follows 3 and 4.
3. **Figma:** first the Figma component (page `UI Elements`) and the project's mapped component that mirrors it (`zehn.project.json`), then the Figma frame for the screen.
4. **The app's existing sibling screens** (the mapped example screen and the screens next to the one you're building). For layout they come first: if they use a sidebar, cards or no page header, so does the new screen. If they lack a catalog pattern (HeaderPattern, a stat-card row), leave it out. Why: one new page that looks different from its neighbours is worse than all of them missing a pattern.
5. **The component catalog and the remaining rules**, for anything Figma or the siblings don't show.
6. **Your own judgement.** List it under Design gaps.

When unsure, follow Figma.

Every time a lower level lost to a higher one, add a Design gaps line: `<element>: Figma <value>, used <value> (why)`. When you swap in something simpler than what was asked (native date inputs for a date-range picker, a checkbox list for a multi-select), that's a gap too. When you commit or open a PR, put the Design gaps list in its message, so the designer can see it in the repo.

---

## 0. Product family

zehn is one platform with many apps. All apps share one shell, one component library and one token set.

Each app has **one accent color**. The accent tells you which app you're in; it never signals state or action. Allowed uses, complete list:

1. the app name in the logo (`zehn` + `/app`)
2. the page header's 2px bar and 32px icon
3. the first stat card tint (`StatCard highlighted`)
4. `RoleBanner tone="accent"` fill
5. TaskCard 2px top bar
6. MobileTabBar active item
7. the intelligence chat send button and bubbles

Anything else is off-system: buttons, badges, counters, links, selection, body text, "recommended" or highlighted cards. Colors the user picks for their own data (board, label or calendar colors) may use the hue tokens (`violet`, `coral`, `teal`…, their `-fill`/`-stroke`); they're data, not the accent. Use Neutral or a status color there. The Switch "on" color is Cyan in every app; it's a component color, not the accent.

| App (`data-app` value) | Accent |
|---|---|
| procurement, intelligence, aip, desk, office | `Cyan` |
| hr, tasks (task), analytics, edge | `Orange` |
| meet | `Pink` |
| docs | `Blue` |
| geo | `Yellow-Green` |
| edu | `Edu Green` (`--zm-edu-green*`) |

A module not in this table (anbar, abat, any new one) has no accent yet: ask the developer once which one to use (see "Ask the developer"), recommending Cyan unless the designer named one, and save it in `zehn.project.json` `app`. A page that shows several modules (a launcher, an app switcher) sets `data-app` per item, so each `zehn/<app>` takes its own accent.

## 1. Foundations

- **Font:** Inter, weights 400 and 600 only. In code: `text-{xs…3xl}` plus `font-normal` / `font-semibold`. The preset already sets the -1% letter spacing, so never add `tracking-*`. (Figma style names look like `text-sm-14pt/semibold`; they are not classes.)
- **Icons:** the app's icon set; zehn's is Remix Icon, `-line` style; `-fill` only for an active or selected state. The icon size matches the text it sits in: 16px in small buttons, `text-xs`/`text-sm` rows, chips and inputs; 20px in medium and large buttons, IconButtons and the top bar. Page header: a 32×32 box (`w-header-icon h-header-icon`) with a 32px glyph (`text-header-icon`), accent color, no background.
- **Color:** the project's tokens only. No hex, rgb, named colors or unlisted Tailwind colors. Light and dark must both work.
- **Spacing:** the project's `spacingKeys` if it has them, else the zehn subset (tokens cheat sheet).
- **Radius by element.** An element not listed takes the radius of the closest one, and you list it under Design gaps.

| Element | Radius | Class |
|---|---|---|
| web card, panel, table container, banner, toast, badge, tooltip, skeleton | 4 | `rounded` |
| button and IconButton (medium, large), input, select, textarea, menu, popover | 8 | `rounded-lg` |
| small (24px) button, IconButton and Segmented Control item | 4 | `rounded` |
| modal, alert dialog | 12 | `rounded-xl` |
| drawer | 0 | none |
| mobile card | 16 | `rounded-2xl` |
| avatar, counter, progress bar, switch | full | `rounded-full` |

- **Shadows:** web cards use a 1px `border-border-default` and no shadow. `shadow-100`: raised controls (segmented thumb, switch thumb). `shadow-200`: tooltips, toasts. `shadow-300`: menus, modals, drawers, alert dialogs. `shadow-focus`: the focus ring.
- **Primary action:** always `primary` (black in light, white in dark), in **every app**, including docs, geo and edu.
- **Never pill buttons or inputs, never gradients.** Buttons and inputs use the radius table above. The AI gradient (`bg-ai-gradient`) lives only in the assistant `Orb`.

## 1a. Craft details
Small things the components can't do for you:
- **Numbers:** money, counts, IDs and dates in tables and stat cards use `tabular-nums`; number columns align right, with their header.
- **Text:** long prose (descriptions, comments, help) stops at about 65 characters a line (`max-w-prose`). Headings that wrap get `text-balance`. Type the ellipsis `…`, never `...`; truncate with `truncate` plus a Tooltip with the full value. No italics or underlines for emphasis (underline means a link); use `font-semibold`.
- **Spacing:** space siblings with `gap` (or `space-y-*`) on the parent, not margins on each child. A rounded element inside a rounded one: inner radius = outer radius − padding (or 0).
- **Disabled:** the disabled tokens (`bg-disabled-bg text-disabled-fg`), never `opacity-50` on a control.
- **Focus:** never remove the focus ring without a replacement (`outline-none` only together with `focus-visible:shadow-focus` or the app's ring).
- **Icons:** one icon set per app. One icon, one meaning (a chevron that expands doesn't also navigate). 8px between an icon and its label (the components do this).
- **Clickable things** are `<button>` or `<a>`, never `<div onClick>`. Don't wrap a whole card in one `<a>`: make the title the link (and stretch it over the card if needed).

## 2. Desktop shell (default)

Use the app's own shell. These are the zehn defaults for a new app or a screen with no siblings.

- **Top bar:** 56px, `bg-surface-base`, 1px bottom `border-border-default` (`TopBar`).
  - Left: logo `zehn` + `/app` in the accent, a 1×16 divider, then nav as **ghost tabs** (ghost Button, icon + label). The active tab gets the subtle fill.
  - Right: bell IconButton + red Counter, a divider, a ghost "Support" button and the avatar.
  - Navigation lives in the top bar by default. An app whose shell has a sidebar (or that needs one: many sections, deep settings) uses a sidebar; keep its items as ghost buttons with icon + label. Don't use a Segmented Control as app navigation.
- **Page header** (`PageHeader`, list and overview pages): 2px accent bar, 32px accent icon, H1 `text-2xl font-semibold`, a gray subtitle with live counts ("1 request waiting on you"). `HeaderPattern` sits behind its top right.
  - Actions on the right, in this order: up to 2 `secondary` buttons, then a `…` IconButton Menu for the rest, then the one `primary`.
  - Export is a `secondary` button labeled "Export" with the `download-2` icon. When it offers formats, it opens a Menu ("Export as CSV", "Export as XLSX"). File name: `{app}-{items}-{dd.mm.yyyy}.csv`, e.g. `procurement-requests-30.06.2026.csv`.
- **Detail header** (`DetailHeader`): back IconButton or "< All {items}" link, `#ID` (`text-xs`, gray), the title, a meta row (avatar + name · Submitted 01.06.2026 · Needed by 30.06.2026 (in 28 days)), a `…` menu on the right, a divider below.
- **Content width.** Default by what the page shows (siblings win):
  - Columns aligned across rows (a table), a board, a builder or charts → full width, 24px gutters (`px-6`, no max width).
  - The detail of one object → 896 centered (`max-w-column-detail mx-auto`): 560 main + 16 gap + 320 side column.
  - Everything else (card feeds, inbox rows, settings, a form on a page) → 768 centered (`max-w-column-narrow mx-auto`).

- **Narrow screens:** no sideways scroll down to 1024px wide (or the app's minimum). Card and stat rows wrap (`flex-wrap` or a responsive grid); top-bar nav that doesn't fit moves into a `…` Menu; tables scroll inside their container, not the page.
- **Cross-module navigation** (zehn office: moving between modules): `AppSwitcher`, a 240px sidebar list, active item neutral. A module's own pages keep their TopBar tabs.
- **Grids of objects** (boards, dashboards, projects): `ObjectCard` in `ObjectGrid`, full width. The whole card opens the object; its `…` menu stays separately clickable.
- **Which app:** `app` in `zehn.project.json`, else the `data-app` the repo already sets. Neither, or a new area that isn't a zehn app: ask the developer (see "Ask the developer").

## 3. Screen types (default recipes)

Starting points, not requirements. Match the sibling screens first; pick the recipe that fits the content.

| Type | Recipe |
|---|---|
| Table list | page header → optional stat-card row (3–5, first `highlighted`) → toolbar → full-width DataTable |
| Card feed | page header → search → filter chips → cards (768 column) |
| Detail | detail header → 560 main + 320 side panels (Details, People, Activity) |
| Builder | 64px sub-bar (Back, title, Preview, Publish) + 240 palette + canvas + 320 inspector |
| Board | kanban columns of TaskCard |
| Dashboard | rows of chart cards and stat cards |
| Empty | keep the header, search and filters; `EmptyState` centered with a title, one line and an optional small button |

**Create/edit container.** Default order (follow how the app already does it):
1. Destructive confirm → `AlertDialog` (520).
2. Repeated sub-items (line items) → a full page (e.g. procurement New Request).
3. Multi-step, or more than 8 fields → `Drawer` 520 (`size="wide"` 640 when it holds a table), with a stepper if multi-step.
4. Two-column form or a side-by-side preview → `Modal size="xl"` (904).
5. One field group wider than 472px (e.g. an inline 4-column row) → `Modal size="wide"` (600).
6. Otherwise (one step, up to 8 fields) → `Modal` (520).

**Modal and drawer shell** (the components do this): header 64px (tinted icon + title + subtitle + close), body padding 24 with fields 16px apart and section headings, sticky 56px footer right-aligned with `secondary` Cancel then the action. Backdrop `bg-scrim` (stays dark in dark mode). Modal and alert dialog radius 12, drawer 0, `shadow-300`.

**Toolbar:** one row, 12px gap: Segmented Control or filter chips · search Input (`flex-1`) · filter Selects · pager `< 1 / 45 >`.
- Segmented Control when the options are 2–5 views of the same list (All / Mine / Archived).
- Filter chips when the options filter by a value and show counts (Pending 4, Approved 12).

## 4. Components

Use the components mapped in `zehn.project.json` first, then the zehn fallback components (`fallback.zehnDir`), then build from the catalog spec with the app's primitives. Never rebuild a Button, Badge, Input, Avatar, Menu, Toast or Empty State. A new shared component is built from the existing ones too (a swatch picker from Radio, breadcrumbs from links and Icon): raw `<button>`/`<input>` belong only in the components that wrap them. Never restyle a component through `className` (colors, radius, padding, height, font); pick a variant or size, or list the missing variant under Design gaps. Layout classes (margin, width, flex) are fine. Button variants and their uses: see the catalog, Button.

- **One `primary` per surface.** A page, a modal, a drawer and an alert dialog each count separately. Web: last on the right. Mobile: the full-width bottom CTA. Approve (`color-primary`) and the destructive confirm (`destructive-primary`) replace the primary; they don't add to it.
- **Status badges** (`Badge status=…`, always tinted with an icon; never the accent):

| Meaning | Prop | Examples |
|---|---|---|
| done / active / approved / online | `status="success"` (green) | Approved, Active, Completed, Online |
| waiting | `status="warning"` (peach) | Pending, On vacation, Deploying |
| in progress / info | `status="info"` (blue) | In review, Running, Business trip |
| failed / rejected / urgent | `status="danger"` (red) | Rejected, Offline, Failed, High priority |
| inactive | `status="neutral"` | Paused, Planned, Stopped, Withdrawn, Private |

  Role or type labels that aren't a state (Admin, Maternity leave, E-IMZO): `Badge` with `color` violet, coral or pink. Use the same hue for the same label everywhere. Never `yellow` for a status.
  Priority: High = red flag icon + red text. Normal shows nothing.
- **Data table:** rows 48px; 36px (`dense`) only when the table shows more than 20 rows per page or sits in a drawer. Header 36px gray, first column bold, status column a Badge, a `…` row menu (Edit, divider, red Delete).
- **People:** `Avatar` (initials) + the full name. `AvatarGroup` for teams.
- **Menu:** the destructive item goes last, red, after a divider (the component does this).
- **Toast:** bottom-right stack, 432px, after save, copy or send. Success, or Error with Retry (`onRetry`). One optional action ("View").
- **Tooltip:** explains an icon-only control, a truncated value, or why an action is disabled. One short sentence. Its child must be focusable. For a disabled action, use `disabledReason` on Button or IconButton (it keeps focus and shows the tooltip). For truncated text, wrap it in `<span tabIndex={0}>`. If the reason is the only way forward ("Ask the owner to share it"), show it as visible text or a RoleBanner, not a tooltip.
- **Chart cards (dashboards):** 334px tall (`h-chart-card`), radius 4, padding 16, 16px gap in a full-width row; plot area 208px (`h-chart-plot`) under the title and legend. Up to 3 per row at 1440, or one 2/3 + one 1/3.
- **Charts:** `--zm-chart-1…8` in order (Cyan → Blue → Violet → Pink → Coral → Yellow-Green → Teal → Orange). Positive `--zm-chart-positive`, negative `--zm-chart-negative`, plus the grid and axis tokens. Never raw hues. Readable in dark. An empty-data widget shows a gray outline of its chart type.
- **Tabs inside a page:** Segmented Control. No underline tabs.

## 5. Forms and behavior

- The label goes above the field. Mark required fields with a red `*` (`required`) and nothing else. Never write "(optional)".
- Group fields with section headings (16px icon + label) and dividers.
- Helper text (`bottomHint`) and InfoChips go under the field. Placeholders are realistic examples ("e.g. Macbook Pro M5 for new design hire").
- Validation: `error="<message>"` on the field, shown on blur and on submit. Focus the first error. Errors sit next to their field, never only in a list at the top. An error shows a red border, an icon and text, never color alone.
- Search inputs filter as you type, debounced about 300ms.
- Copy-to-clipboard swaps its icon to a check for about 1.5s (motion skill, icon swap).
- Act on click (`onClick`), never on `mousedown`. Code inputs don't jump to the next box on their own unless the OTP component does it.
- Loading: `loading` on the Button; `Skeleton` rows for tables and cards.
- Success: a success Toast. Failure: an error Toast with `onRetry`.
- **Alert Dialog before every destructive action:** delete, terminate, withdraw, reject, stop, end session, log out of other devices. The title names the action and the object ("Withdraw request #REQ-3?"); one line says the consequence; buttons are Cancel + `destructive-primary` with the verb.
- If the object has an archived state in the API, the menu offers Archive, not Delete. Otherwise Delete, behind an Alert Dialog.
- **Permissions stay visible.** A disabled action says why (`disabledReason="Only the owner can close this board."`). Read-only viewers: `RoleBanner tone="warning"`, title "View-only access", one line on who can grant edit. A viewer who must act (e.g. an approver): `RoleBanner tone="accent"`.

## 5a. Accessibility (baseline; zehn wins on visuals)

- Dialogs and drawers trap focus, close on Escape, and return focus to the opener. Alert Dialog focuses Cancel first. (The components do this.)
- Menus: arrow keys, Home/End, Escape returns focus to the trigger. Segmented Control: arrow keys.
- Toasts pause while hovered or focused. Errors use `role="alert"`.
- Icon-only buttons need an `aria-label`. Inputs wire their label and hints (`aria-describedby`, `aria-invalid`).
- Loading keeps the button's own color and sets `aria-busy`.
- Every animation has a reduced-motion path (§9). zehn motion tokens drop to 0ms on their own.
- The shell has a "Skip to content" link that shows on focus. DOM order matches the visual order (no `order-*` reshuffles).
- Tooltips hold text only; anything clickable goes in a Popover or Menu.
- zehn sizes stay as designed on web (32px medium buttons, not 44px). Mobile tap targets are at least 44px.

## 6. Mobile (edu, desk)

- 402px iOS frames. 16px side margins. Cards radius 16 (`rounded-2xl`). The Status Bar and Home Indicator are Figma frames only; the OS draws them, so never build them.
- Tab screens: large title `text-3xl font-semibold`; use `text-2xl` only if the title wraps at 3xl. Pushed screens: a 42px round back button + `text-xl font-semibold` title.
- Tab bar: MobileTabBar (catalog), a floating 386×64 pill.
- Primary CTA: full-width, fixed to the bottom above the Home Indicator (pad with `env(safe-area-inset-bottom)`), black, 16px side margins. zehn has no FAB: a FAB request is off-system (§8a). Offer the bottom CTA or a `+` IconButton in the title row.
- Bottom sheets: ✕ to cancel, ✓ to save.
- Empty cards are dashed, with a reload button. Full-screen No internet / 500 states have Retry.
- Dark mode is required.

## 7. AI

- In-app AI actions: `ai-primary` / `ai-secondary` (pink, sparkle icon by default). AI dialogs: `Modal`/`Drawer tone="ai"` (flat `bg-ai-bg` header). An AI panel uses `bg-ai-bg`. No gradient ships in code, so never hand-build one.
- The zehn intelligence assistant uses `Orb` (`state` default / listening / thinking) and `OrbLauncher` (64px, bottom-right), plus the accent send button and chat bubbles. The orb is the one place a gradient is allowed. Don't use it anywhere else, and never rebuild it by hand.

## 8. Copy and formatting

- **Sentence case** everywhere: buttons, titles, tabs, menus ("Create board", "Submit for approval").
- **Tone:** short, friendly, second person ("Your requests", "Tell us what you need."). No "please" in buttons and prompts.
- **Specific labels:** buttons say the outcome ("Save changes", "Send for approval"), never "Submit", "OK" or "Yes". Errors say how to fix it ("Enter an amount above 0"), never "Invalid input" or "Something went wrong" alone. Put the important word first.
- **Empty and error states** say why and what to do next, with the action as a button ("You haven't created a request yet" + "New request"). Error pages name what failed and offer a specific way out (Retry, Go to requests).
- **Dates:** `30.06.2026`. Calendars and date pickers start the week on Monday; month and weekday names come from the locale. Date-time: `30.06.2026 14:27` (24h). Ranges: `12.01.2026 – 31.01.2026 · 10 days`. Add relative time next to deadlines: "(in 28 days)". Same in every locale.
- **Money:** en `24,000,000 UZS`; ru and uz `24 000 000 UZS` (non-breaking space, decimal comma). The code goes after the number. UZS is the default; when the data has its own currency (a USD price, a foreign supplier), show that currency (`formatMoney(827, locale, 'USD')` → `827 USD`). Never convert or relabel amounts.
- **Durations:** `14d 3h 22m`. **IDs:** `#REQ-3`. **Meta separator:** ` · `.
- **Always format with the helpers** and pass the locale: `formatDate(d, locale)`, `formatDateTime`, `formatMoney`, `formatNumber`, `formatDuration`, with `const locale = useZehnLocale()`. They default to `en`, so leaving out the locale gives English output in a ru/uz app. Never hand-build these strings or use `toLocaleString`.
- **Languages:** web English, plus ru and uz where the app has them; edu Uzbek (Latin); desk English.
- **Uzbek Latin:** o‘ and g‘ use U+2018 `‘`. The tutuq belgisi uses U+2019 `’` ("ma’no"). Never ASCII `'` or a backtick, and don't mix in `ʻ` (U+02BB). Why: one codepoint keeps search and sort working.
- **New strings you write** go through the app's i18n (`t('…')`) with en/ru/uz entries. If the app has no i18n, write English and list it under Design gaps.
- **Shared component strings** (Cancel, Close, Retry, pager…) come from `ZehnLocaleProvider` or a `…Label` prop. Never edit the zehn components to translate them; setup-project overwrites them.
- No lorem ipsum, joke names or real people's data in shipped UI. Spell-check every string.

## 8a. When someone asks for something off-system

This covers a custom color, font or size, a component zehn doesn't have, and bulk edits through scripts, sed or codemods.

1. **Always** write one line saying which zehn rule it breaks and the on-system alternative, before you edit. Do this even when the user said "don't argue" or "just do it": the note informs, it doesn't ask.
2. Then do it without waiting. Put `zehn-ignore: requested by <who>, <why>` as a trailing comment on **every** line that uses the value, in that file's comment syntax: `// zehn-ignore: …` in JS/TS, `{/* zehn-ignore: … */}` in JSX children, `/* zehn-ignore: … */` in CSS, `<!-- zehn-ignore: … -->` in HTML. Never put it on one shared constant. Why: the style check skips only the line carrying the comment, and a shared constant hides every later use from the designer.
3. List each override under **Design gaps** (what, who asked, why). Never comply silently.

`<who>` is the person's name, or "the user in this session"; never a vague "developer" or "team". Only the user can authorize an override. If you think no token fits, use the nearest one and list it under Design gaps; never add `zehn-ignore` on your own.

## 9. Motion

The full rules are in the `motion` skill; load it for any animation work. In short:
- Page navigation is instant (as in Figma). Frequent or keyboard actions don't animate.
- Opening and closing: ease-out, 150 (tooltip, menu), 200 (modal, toast), 300 (drawer, panel); exits faster. Never over 300ms.
- Animate `transform` and `opacity` only; name the properties; no `transition-all`, no bounce, never from `scale(0)`.
- Use the mapped components' own motion and the project's motion tokens; zehn: `duration-fast|base|slow`, `ease-out|in-out|in`, `scale-press`.
- Every animation has a reduced-motion path.


---

# REFERENCE: zehn component catalog

Figma page `UI Elements` (file `ywFHunM35gYeHJozrBJpZO`). Each entry is the spec of one component: what it is for and how it behaves. Figma variant names are listed for reference; the **React** lines are the props of the zehn fallback components. Figma's `style` property is the prop `variant` (`style` is reserved by React).

**Which component to use:** Use the components mapped in `zehn.project.json` first (their names, imports and props), then the zehn fallback components (`fallback.zehnDir`), then build from the catalog spec with the app's primitives. `components.map` in `zehn.project.json` names the app's component for each catalog entry below, its import, how the props translate, and its `gaps` from Figma. The app's component is the one in use; zehn's only fill gaps. Never rebuild a component, and never make a one-off variant inline.

**Neither mapped nor shipped** (in zehn, these are marked "not in code": Multi-select, OTP Input, Breadcrumbs, MobileTabBar): build it once in the app's `components.dir` (or `fallback.zehnDir` in a zehn-fallback app) from the spec here, with the app's existing primitives and tokens and in their style, following the closest existing component. List it under Design gaps. Never inline it in a screen.

A mapped or shipped component and a Figma frame differ (radius, padding, color)? Use the component as it is and note it under Design gaps (for a mapped one, its `gaps` entries). Never restyle it to match the frame. Why: one component must look the same on every screen.

Non-React stacks: build each component once in the shared UI folder with these props.

## Actions

### Button
Figma: size large 40 · medium 32 · small 24; style (9 variants).
React: `<Button variant size leftIcon rightIcon counter loading disabled disabledReason still>`. Theme: switch light/dark with `setTheme()` / `useTheme()` (transitions stay off during the switch). Hover, focus and press feedback (scale 0.96) are automatic; `still` turns press feedback off for dense, high-frequency spots (table row actions, toolbars, pagers).
- `size`: `large` · `medium` (default) · `small`. Small is radius 4, the others 8.
- `leftIcon` / `rightIcon`: Remix name or a node. AI variants add a sparkle; `leftIcon={null}` removes it.
- `loading`: spinner, keeps the width and the variant's color, sets `aria-busy`.
- `disabledReason="Only the owner can close this board."`: use this instead of `disabled` when the user should learn why. The button stays focusable (`aria-disabled`), ignores clicks, and shows the reason in a Tooltip. Plain `disabled` removes it from the tab order, so a Tooltip on it never reaches keyboard users.

What each variant is for:
- **primary:** black. The main action, one per surface (rules §4).
- **secondary:** gray fill. Cancel and other actions. Small + icon for inline actions ("+ Add").
- **ghost:** nav tabs and quiet toolbar actions.
- **color-primary:** green. Approve only. **color-secondary:** tinted green, a secondary positive action.
- **ai-primary / ai-secondary:** pink. AI actions only.
- **destructive-primary:** red. The confirm button inside an Alert Dialog.
- **destructive-secondary:** tinted red. Reject or Withdraw buttons that open an Alert Dialog.

Asked for a red or colored button? A destructive action → `destructive-secondary` + AlertDialog. Anything else is off-system (rules §8a).

### IconButton
React: `<IconButton icon aria-label variant size loading disabled disabledReason still>`. `aria-label` is required. Default `variant="ghost"`. Used for back, close, `…` menus, the bell and toolbars.

### Counter
React: `<Counter value max size tone color>`.
- `size`: small · medium · large. `tone`: tinted · filled. `color`: neutral · white · red.
- `white`: only on a solid button (Button sets it for you). `max={99}` renders `99+`. Notification bell: `tone="filled" color="red"`.

## Display

### Icon
React: `<Icon name="close" />` renders `ri-close-line`. Add `-fill` for filled (active or selected only). Icons are Remix names; map each Figma icon to the nearest Remix name (layer names usually match). Never download icon or image assets from Figma. Size comes from the parent's font size (rules §1); never set `w-`/`h-` on an icon. `<Icon>` is `aria-hidden`, so the control around it needs a label.

### Badge
Figma: size, style tinted · filled · ghost, color.
React: `<Badge status size leftIcon rightIcon>` for states, `<Badge color appearance>` for labels.
- `status`: success · warning · info · danger · neutral. Sets tinted, the hue and a default icon (`checkbox-circle`, `time`, `information`, `close-circle`, `pause-circle`). Override the icon with `leftIcon="<remix name>"`. Never pass `color` together with `status`.
- `color`: neutral · red · green · peach · teal · yellow · coral · pink · blue · violet. `appearance`: tinted (default) · filled · ghost. `size`: small · medium.
- Radius 4. Which status or color to pick: rules §4. There is no accent badge.

### Avatar, AvatarGroup
React: `<Avatar name src icon size status counter>`. The type follows the props: `src` → image, `name` → tinted initials, `icon` → icon. `size`: 16 · 20 · 24 · 32 · 48 · 64 · 96 · 128. `status` = online dot.
`<AvatarGroup people={[{name, src}]} size max>`: stacked + "+N", sizes 16–48.
Always show the full name next to an Avatar in lists.

### EmptyState
React: `<EmptyState icon title description action blur>`. `action` is an optional small Button. Keep the page header, search and filters above it.

### HeaderPattern
The top-right art for list and overview pages (never detail pages or modals). Never redraw it or download it from Figma.
```tsx
<main className="relative overflow-hidden">
  <HeaderPattern />
  <div className="relative">…page…</div>
</main>
```

### AI gradient and the assistant orb
AI surfaces are flat: `Modal`/`Drawer tone="ai"` for dialogs, `bg-ai-bg` for a panel. The only gradient is the intelligence assistant's orb (Figma "zehn/intelligence"): `<Orb state size aria-label>` (`state` default · listening · thinking; `size` launcher 64 · hero 128) and `<OrbLauncher aria-label state onClick>` (fixed bottom-right). Never hand-build a gradient or another orb.

## Inputs

### Input, Select, Textarea
Figma: size medium 32 · large 40; states default · filled · focused · error · disabled.
React, shared field props: `label`, `required` (red `*`), `topHint`, `bottomHint`, `error` (`true` or a message; a message replaces `bottomHint`, in red with an icon), `disabled`.
- `<Input size leftIcon rightIcon>`: text and search (`leftIcon="search"`).
- `<Select size leftIcon placeholder>`: a native select; the chevron is built in.
- `<Textarea maxLength rows>`: no size or icons; `maxLength` shows the `0/200` counter.
- Use `className` for layout (e.g. `flex-1`), never to restyle the box.

### Multi-select Field (not in code)
Same field props as Input; selected items show as small Badges inside the box. Follow `Select` and `Badge`.

### OTP Input (not in code)
Figma: size small · medium · large · mega; `dot` (masked). One box per digit, each like an Input. Follow `Input`.

### Checkbox, Radio, Switch
- `<Checkbox checked indeterminate disabled label description>`.
- `<Radio name checked disabled label description>`. Group several in a `<fieldset>` with a `<legend>`.
- `<Switch checked defaultChecked onCheckedChange size disabled label>`. `size`: medium · small. Track off gray, on **Cyan** in every app (a component color, not the accent), white thumb.

## Navigation

### SegmentedControl
React: `<SegmentedControl items={[{value, label, icon, counter, disabled}]} value onValueChange size aria-label>`. 2–5 items, `aria-label` required. In-page views and sections only, never app navigation.

### FilterChips
React: `<FilterChips items={[{value, label, count}]} value onValueChange aria-label>`. Small Buttons: active primary, inactive secondary, with a Counter. When to use which: rules §3.

### Breadcrumbs (not in code)
Figma: size small · tiny; `chevronDivider`. Deep hierarchies only (project → board → task). Follow the `DetailHeader` back link.

### Menu
React: `<Menu trigger={<IconButton icon="more-2" aria-label="Actions" />} items footnote align>`.
- `items`: `{label, description, icon, right, destructive, disabled, onSelect}`. `right` takes any node (shortcut text, Badge, Counter). Destructive items move last, red, after a divider.
- `footnote`: a small gray note at the bottom.
- Avatar, checkbox, radio and switch rows are Figma only. For a multi-select list use Checkbox rows in a Drawer, not a Menu.

## Feedback

### Toast
React: wrap the app once in `<ToastProvider>` (inside `ZehnLocaleProvider`), then `const { toast, update, dismiss } = useToast()`.
`toast({ type, title, subtitle, action: {label, onClick}, onRetry, duration })`. `type`: default · info · loading · success · warning · error. `onRetry` adds a localized Retry. A loading toast stays until you `update(id, …)` it. When to show one: rules §4.

### AlertDialog
React: `<AlertDialog open onClose onConfirm title subtitle confirmLabel loading icon>`. `confirmLabel` (the verb) is required; `icon` defaults to `delete-bin`.
- Title: verb + object, e.g. Delete board “Mobile app”? (curly quotes around the name).
- Subtitle: one line on the consequence.
- Initial focus is on Cancel; the scrim does nothing; `loading` keeps it open.

### Tooltip
React: `<Tooltip content side delay>{one focusable child}</Tooltip>`. `side`: top · bottom; `delay` 300ms. Dark, `text-xs`, radius 4. When to use it and the focus rule: rules §4. For a disabled button use `disabledReason`, not a Tooltip around `disabled`.

### ProgressBar
React: `<ProgressBar value max label showValue size>`. Track 8px (`medium`, default) or 4px (`small`); the label and % sit above it. Fill `bg-progress-fill`; a status color only when the value means something.

### Skeleton
React: `<Skeleton shape="text|rect|circle">`, sized with `h-`/`w-`. Radius 4 like the card it replaces. Wrap the loading region in `aria-busy="true"`.

## Layout (shipped)

| Component | React | Notes |
|---|---|---|
| **TopBar** | `<TopBar app nav={[{label, icon, href, active}]} unreadCount user onNotificationsClick onSupportClick right>` | The whole 56px shell bar. The active tab gets the subtle fill (`buttonClass({ variant: 'ghost', selected })` for your own nav). |
| **AppSwitcher** | `<AppSwitcher apps={[{id, name, href, icon, badge}]} current version renderLink>` | Cross-module sidebar (240px) in zehn office. Each item takes its own app accent on `/name`; the current one is neutral `surface-subtle`. |
| **ObjectCard**, **ObjectGrid** | `<ObjectCard title href/onOpen description meta footer menu badge accentBar renderLink>` in `<ObjectGrid>` | Boards, dashboards, projects (Figma Board Card, 389×117, radius 4). The whole card opens the object; `menu` stays clickable; `footer` is display only. `accentBar` = TaskCard's 2px accent top bar. |
| **PageHeader** | `<PageHeader title subtitle icon actions>` | Action order: rules §2. |
| **DetailHeader** | `<DetailHeader back={{href, label}} id title meta={[…]} menuItems actions>` | `meta` is joined with ` · `. |
| **StatCard** | `<StatCard label value delta={{label, status}} highlighted>` | Put 3–5 in `<div className="flex gap-4">`; they grow from a 288px basis. Only the first gets `highlighted`. |
| **DataTable** | `<DataTable columns rows getRowId caption rowActions dense loading empty onRowClick>` | `caption` is required. Clickable rows: `onRowClick`, never a raw button. |
| **Toolbar**, **Pager** | `<Toolbar aria-label>…</Toolbar>`, `<Pager page pageCount onPageChange>` | Order: rules §3. |
| **PanelCard** | `<PanelCard title icon rows={[{label, value}]}>` | Side panels on detail pages. |
| **InfoChip** | `<InfoChip icon tone>` | Under a field. |
| **ActivityFeed**, **ActivityItem** | `<ActivityFeed><ActivityItem icon tone name action timestamp dateTime last /></ActivityFeed>` | ActivityItem must sit inside ActivityFeed. |
| **RoleBanner** | `<RoleBanner tone title description icon actions>` | `tone`: `accent` (default; the viewer must act) · `info` (cyan) · `warning` (view-only access). |
| **Modal** | `<Modal open onClose title subtitle icon tone size footer initialFocusRef closeOnScrim>` | `size`: default 520 · wide 600 · xl 904. `tone` includes `ai`. Focus goes to `initialFocusRef`, else the first `data-autofocus` element. |
| **Drawer** | `<Drawer … size stepper footer>` | `size`: default 520 · wide 640. |

Which container to pick: rules §3. Modal, Drawer and AlertDialog render in place as `fixed` overlays; render them at page level, never inside a card, table or an element with `transform`, `filter` or `overflow-hidden`.

## Not in code yet

| Pattern | Spec | Follow |
|---|---|---|
| **MobileTabBar** | Floating 386×64 pill, 5 items max, icon + label per item, active item in the accent. | `SegmentedControl` |

## Locale

Wrap the app once: `<ZehnLocaleProvider locale={<the app's current locale: en | ru | uz>} labels={{…}}>` outside `ToastProvider`. Take the locale from the app's i18n, never a literal. Built-in strings (Cancel, Close, Retry, pager…) then localize; `labels` overrides single strings; per-instance props like `cancelLabel` still win.
`const locale = useZehnLocale()`, then `formatDate(d, locale)`, `formatDateTime`, `formatMoney(n, locale)`, `formatNumber`, `formatDuration(ms, locale)`. Format rules: rules §8.


---

# REFERENCE: zehn tokens cheat sheet

In an app with its own theme, use its tokens (`tokens` in `zehn.project.json`; Figma variable → token in `tokens.figmaMap`). The zehn tokens below are the fallback, and their names tell you which role a token plays.

All values come from Figma variables. Never hardcode a value that exists here. Before you call a token missing, check this sheet and the semantic tokens below; if nothing fits, use the nearest token and list it under Design gaps.
A fallback app gets copies of the token files through setup-project (`src/styles/zehn/`). The originals are in `${CLAUDE_PLUGIN_ROOT}/tokens/`.

## Setup in an app (once)
- setup-project wires `tokens.css` and the Tailwind preset (fallback only). The preset **replaces** colors, radius, font sizes and weights, shadows, transition durations and easings; it **keeps** Tailwind's spacing keys.
- On `<html>`: `data-app` = procurement | intelligence | desk (cyan) · hr | tasks | analytics | edge (orange) · docs (blue) · geo (yellow-green) · edu (edu-green). Without it the accent is cyan.
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
| AI | `--zm-ai`, `--zm-ai-bg` | `text-ai bg-ai-bg` |
| Disabled control | `--zm-disabled-bg` / `--zm-disabled-fg` | `bg-disabled-bg text-disabled-fg` |
| Dialog backdrop (stays dark in dark mode) | `--zm-scrim` | `bg-scrim` |
| Notification counter (red) | `--zm-counter-bg` / `--zm-counter-fg` | `bg-counter-bg text-counter-fg` |
| Tooltip | `--zm-tooltip-bg` / `--zm-tooltip-fg` | `bg-tooltip-bg text-tooltip-fg` |
| Progress bar | `--zm-progress-track` / `--zm-progress-fill` | `bg-progress-track`, `bg-progress-fill` |
| Segmented Control track | `--zm-bg-segment-track` | `bg-bg-segment-track` |
| Always white / always black (switch thumb, text on a solid hue) | `--zm-const-white` / `--zm-const-black` | `bg-const-white`, `text-white` |
| Charts (in this order; 1–7 keep 3:1 contrast, 8 needs labels) | `--zm-chart-1..8`, `-positive`, `-negative`, `-grid`, `-axis` | `fill-chart-1`, `stroke-chart-1`… |

Dark mode: `const-white`, `const-black` and `gray-*` don't flip the way surfaces do. Never use them for surfaces or body text.

## Primitives (only when no semantic token fits)
- Each hue: `--zm-{hue}`, `-lighter`, `-darker`, `-stroke`, `-fill-1`, `-fill-2`. Tailwind: `text-cyan`, `bg-cyan-fill-2`, `border-cyan-stroke`. Hues: cyan, teal, blue, violet, pink, coral, red, orange, lime, yellow-green, green, edu-green. `edu-green` has `-deep` and no `-lighter`; `green` and `yellow-green` add `-bg-strong`.
- Grays: `--zm-gray-50…900` (black at alpha; flips to white in dark). `--zm-alpha-50…900` is white at alpha, for dark or colored backgrounds.

## Type (Inter; 400 `font-normal` and 600 `font-semibold` only)
Every size already includes -0.01em tracking; never add `tracking-*`.

| Token | Size / line height | Use |
|---|---|---|
| `text-xxs` | 10/12 | tiny tags, small counters |
| `text-xs` | 12/16 | meta, IDs, helper text, table headers |
| `text-sm` | 14/20 | body default, labels, buttons |
| `text-base` | 16/24 | lead text, banner and dialog titles |
| `text-lg` | 18/24 | card titles |
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
| Token | Tailwind | Value | Use |
|---|---|---|---|
| `--zm-duration-fast` | `duration-fast` (and plain `duration`) | 150ms | hover, press, color, tooltip, menu, all exits of small things |
| `--zm-duration-base` | `duration-base` | 200ms | modal, alert dialog, toast, list item change; drawer exit |
| `--zm-duration-slow` | `duration-slow` | 300ms | drawer, side or chat panel enter |
| `--zm-ease-out` | `ease-out` (and plain `ease`) | `cubic-bezier(0.32, 0.72, 0, 1)` | enter, open, close |
| `--zm-ease-in-out` | `ease-in-out` | `cubic-bezier(0.645, 0.045, 0.355, 1)` | moving or resizing something on screen |
| `--zm-ease-in` | `ease-in` | `cubic-bezier(0.55, 0.055, 0.675, 0.19)` | exits only |
| `--zm-press-scale` | `scale-press` | 0.96 | `active:scale-press` on buttons |
Under `prefers-reduced-motion: reduce` the durations become 0ms and the press scale 1, so anything built on these stops moving. Tailwind's `duration-200`, `duration-500` don't exist. Rules: the `motion` skill.

## Layout constants (CSS var `--zm-<name>`, Tailwind `w-`/`h-`/`max-w-<name>`)
| Name | px | Use |
|---|---|---|
| (none) | full | tables, boards, builders, dashboards: `px-6`, no max width |
| `column-narrow` | 768 | feeds, settings, a form page: `max-w-column-narrow mx-auto` |
| `column-detail` | 896 | detail pages (560 `detail-main` + 16 + 320 `side-panel`) |
| `topbar-height` | 56 | top bar |
| `subbar-height` | 64 | builder sub-bar |
| `gutter` | 24 | page side padding (`px-6`) |
| `modal` / `modal-wide` / `modal-xl` | 520 / 600 / 904 | modals |
| `alert-dialog` | 520 | destructive confirm |
| `drawer` / `drawer-wide` | 520 / 640 | drawers (wide when it holds a table) |
| `header-icon` | 32 | page-header icon box and glyph |
| `table-header` / `row` / `row-dense` | 36 / 48 / 36 | data tables |
| `chart-card` / `chart-plot` | 334 / 208 | dashboard chart card / plot area height |
| `toast` | 432 | toast width |
