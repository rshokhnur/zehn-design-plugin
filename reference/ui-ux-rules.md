# zehn UI/UX rules

When reading Figma, use only the styles and components local to file `ywFHunM35gYeHJozrBJpZO` (zehnmind). Ignore remote library copies.

## The project map

zehn is a guardrails layer over the app's own design system. `zehn.project.json` at the app root (written by setup-project) maps the app's tokens, components and example screens to the Figma variables and this catalog. The steps for using it are in the workflow above. Two more rules for every UI change:

1. **Build only what was asked.** No extra actions, filters, stats, pagers, statuses or chips on neighbouring screens. Ideas go under **Suggestions** in your message, not in the code. Keep the data meaning the user gave you (withdraw sets a status, it doesn't delete). Why: the designer and the team decide scope; extra UI is drift too.
2. **Don't edit the shared components** (`components.dir`, the mapped imports, `fallback.zehnDir`) **or the theme** (token files, Tailwind config) to restyle one screen. Never add a token to hold a one-off value. Why: a change there changes every screen. Two exceptions, each listed under Design gaps: the user asked for the change ("design-system change, designer sign-off needed"), or you add a new catalog component the developer chose to build (fork 4) or that setup-project copied ("new shared component: <name>"). Adding a file is not restyling; editing an existing one is.

zehn class names and `--zm-*` tokens in these rules describe the zehn fallback (used when `fallback.zehnTokens` is true). In an app with its own tokens, read them as "the project's token for this Figma variable". The rules themselves (widths, order, which element gets which radius, formats) apply either way. Class names here are Tailwind with the zehn preset. In an app without Tailwind (CSS Modules, styled-components, plain CSS), use the pixel value the rule gives and the project's token in the app's own styling; never add Tailwind classes or copy a zehn component there.

## Rules vs layout defaults

Two kinds of rules live here:
- **Hard rules (always):** the project's tokens and styling (color, radius, type, shadow, spacing, motion), its mapped components and nothing invented, the primary button (black in zehn), the accent list (§0), copy and formats (§8), a confirm before destructive actions (§5), accessibility (§5a). The style check enforces most of these.
- **Layout defaults (adapt to context):** the shell (top bar or sidebar), page and detail headers, HeaderPattern, stat-card rows, cards vs list vs table, content widths, modal vs drawer, screen recipes (§2, §3). Order: "Who wins", layout. Deviate only when the developer asks, or the content is one of: more than 7 sections (→ sidebar), dense data with more than 20 rows a page (→ full width, `dense`), or a widget embedded in another page (→ no page header). No pushback, no `zehn-ignore`, just one `Layout: <what>, <why>` line under Design gaps. Keep every real navigation item; never drop items to fit a pattern.

## Ask the developer at real forks

When nothing here decides a fork, ask the developer instead of guessing: one question, 2–4 short options, your recommended pick first (AskUserQuestion). Ask only at these forks:
1. **An app with no accent** (a module not in §0, e.g. anbar, abat): which accent. Asked once in setup-project.
2. **A big Figma link** (a page or section with many frames): which frames to build. Read only the top-level frames (compose-screen, Step 2a.0).
3. **A layout fork** where the siblings and Figma are silent and the recipes allow both options: a form of 6–8 fields that could be a Modal or a Drawer, or 6–20 objects that could be cards or a table. Where a recipe picks one, use it without asking.
4. **A component the library lacks:** build it once from their pieces, or reuse the closest existing one.
5. **Several equally good mappings** in setup-project (two Button components, two token files).

Don't ask about what the rules, the siblings or Figma decide, or about small details: pick and list them under Design gaps. Save each answer in `zehn.project.json` under `decisions`, keyed `"<screen or component>: <fork>"` in lowercase (e.g. `"requests list: modal or drawer": "drawer"`), so nobody is asked twice; accents go in `app` (§0). Before asking, search the `decisions` keys for the component or screen name. If AskUserQuestion isn't available, or you run with `-p` and no user, take the recommended option and list it under Design gaps.

## Who wins

Walk the matching order from the left; the first source that decides wins.

- **Layout** (shell, headers, widths, cards vs list vs table, modal vs drawer): the user's request (just a `Layout:` line) > the sibling screens and the mapped example screen > the Figma frame > the recipes in §2–3 > your judgement. If the siblings use a sidebar, cards or no page header, so does the new screen; if they lack a catalog pattern (HeaderPattern, a stat-card row), leave it out. Why: one new page that looks different from its neighbours is worse than all of them missing a pattern.
- **Values** (color, size, radius, component, variant, copy, format): the user's request through §8a > the hard rules (why: decided on purpose, they beat old Figma frames) > the Figma component (page `UI Elements`) and its mapped component, then the Figma frame > the sibling screens > the catalog and remaining rules > your judgement.

Still unsure: Figma for a value, the siblings for layout. Judgement calls go under Design gaps.

Every time a lower source lost, add a Design gaps line (format: compose-screen Step 4). Swapping in something simpler than what was asked (native date inputs for a date-range picker) is a gap too.

---

## 0. Product family

zehn is one platform with many apps. All apps share one shell, one component library and one token set.

Each app has **one accent color**. The accent tells you which app you're in; it never signals state or action. Allowed uses, complete list:

1. the app name in the logo (`zehn` + `/app`; the module wordmarks in ObjectCard and AppSwitcher count as the logo)
2. the page header's 2px bar and 32px icon
3. the first stat card tint (`StatCard highlighted`)
4. `RoleBanner tone="accent"` fill
5. a task card's 2px top bar (`ObjectCard accentBar`, task cards on a Board only)
6. MobileTabBar active item
7. the intelligence chat send button and bubbles

Anything else is off-system: buttons, badges, counters, links, selection, body text, "recommended" or highlighted cards. Use Neutral or a status color there. Colors the user picks for their own data (board, label or calendar colors) may use the hue tokens (`violet`, `coral`, `teal`…, their `-fill`/`-stroke`): they're data, not the accent. The Switch "on" color is Cyan in every app; it's a component color, not the accent.

| App (`data-app` value) | Accent |
|---|---|
| procurement, intelligence, aip, desk, office | `Cyan` |
| hr, task, analytics, edge | `Orange` |
| meet | `Pink` |
| docs | `Blue` |
| geo | `Yellow-Green` |
| edu | `Edu Green` (`--zm-edu-green*`) |

**Where the accent is saved:** `zehn.project.json` `app`. The repo's own app: `"app": { "id": "office", "accent": "cyan" }`. Modules the repo also renders under their own `data-app`: `"modules": { "anbar": "violet" }` inside `app`, one entry per `data-app` value. Read these before asking.
A module not in this table (anbar, abat, any new one) has no accent yet: ask the developer once which one to use (see "Ask the developer"). Offer hues no app in the table uses: Violet (recommended), Coral, Teal; or Cyan if the module belongs to procurement or office. Save the answer as above. A page that shows several modules (a launcher, an app switcher) sets `data-app` per item, so each `zehn/<app>` takes its own accent.

## 1. Foundations

- **Font:** Inter, weights 400 and 600 only. In code: `text-{xs…3xl}` plus `font-normal` / `font-semibold`. The preset already sets the -1% letter spacing, so never add `tracking-*`. (Figma style names look like `text-sm-14pt/semibold`; they are not classes.)
- **Icons:** the app's icon set; zehn's is Remix Icon, `-line` style; `-fill` only for an active or selected state. Icon size (the components set it; match it in anything you build): 14 (`text-sm`) in small buttons and small IconButtons; 16 (`text-base`) in medium and large buttons, medium IconButtons, inputs, menus, rows, chips and top-bar tabs; 20 (`text-xl`) in large IconButtons. Page header: a 32×32 box (`w-header-icon h-header-icon`) with a 32px glyph (`text-header-icon`), accent color, no background.
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

## 3. Screen types (default recipes)

Starting points, not requirements. Match the sibling screens first; pick the recipe that fits the content.

| Type | Recipe |
|---|---|
| Table list | page header → optional stat-card row (3–5, first `highlighted`) → toolbar → full-width DataTable |
| Card feed | page header → search → filter chips → cards (768 column) |
| Detail | detail header → 560 main + 320 side panels (Details, People, Activity) |
| Builder | 64px sub-bar (Back, title, Preview, Publish) + 240 palette + canvas + 320 inspector |
| Board | kanban columns of task cards (`ObjectCard accentBar`) |
| Dashboard | rows of chart cards and stat cards |
| Empty | keep the header, search and filters; `EmptyState` (catalog) |

**Create/edit container.** Default order (follow how the app already does it):
1. Destructive confirm → `AlertDialog` (520).
2. Repeated sub-items (line items) → a full page (e.g. procurement New Request).
3. Multi-step, or more than 8 fields → `Drawer` 520 (`size="wide"` 640 when it holds a table), with a stepper if multi-step.
4. Two-column form or a side-by-side preview → `Modal size="xl"` (904).
5. One field group wider than 472px (e.g. an inline 4-column row) → `Modal size="wide"` (600).
6. Otherwise (one step, up to 8 fields) → `Modal` (520).

**Modal and drawer shell** (the components do this; match it if you build one): header 64px (tinted icon, title, subtitle, close), body padding 24 with fields 16px apart, sticky 56px footer with `secondary` Cancel then the action, backdrop `bg-scrim`.

**Toolbar:** one row, 12px gap: Segmented Control or filter chips · search Input (`flex-1`) · filter Selects · pager `< 1 / 45 >`.
- Segmented Control when the options are 2–5 views of the same list (All / Mine / Archived).
- Filter chips when the options filter by a value and show counts (Pending 4, Approved 12).

## 4. Components

Which component, and which `className` a component may take: catalog, top. A new shared component is built from the existing ones too (a swatch picker from Radio, breadcrumbs from links and Icon): raw `<button>`/`<input>` belong only in the components that wrap them. Button variants and their uses: catalog, Button.

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
- **Data table:** rows 48px; 36px (`dense`) only when the table shows more than 20 rows per page or sits in a drawer (or when the siblings' tables are dense). Header 36px gray, first column bold, status column a Badge, a `…` row menu (Edit, divider, red Delete).
- **People:** `Avatar` (initials) + the full name. `AvatarGroup` for teams.
- **Menu:** the destructive item goes last, red, after a divider (the component does this).
- **Toast:** bottom-right stack, 432px, after save, copy or send. Success, or Error with Retry (`onRetry`). One optional action ("View").
- **Tooltip:** explains an icon-only control, a truncated value, or why an action is disabled. One short sentence. Its child must be focusable. For a disabled action, use `disabledReason` on Button or IconButton (it keeps focus and shows the tooltip). For truncated text, wrap it in `<span tabIndex={0}>`. If the reason is the only way forward ("Ask the owner to share it"), show it as visible text or a RoleBanner, not a tooltip.
- **Chart cards (dashboards):** 334px tall (`h-chart-card`), radius 4, padding 16, 16px gap in a full-width row; plot area 208px (`h-chart-plot`) under the title and legend. Up to 3 per row at 1440, or one 2/3 + one 1/3. (Card size is fixed; how many per row follows the siblings.)
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
- **Always format through a helper with the locale**, never by hand and never with `toLocaleString`: the app's formatters first (with its locale source). If it has none, zehn's `formatDate(d, locale)`, `formatDateTime`, `formatMoney`, `formatNumber`, `formatDuration` with `const locale = useZehnLocale()`; they default to `en`, so leaving out the locale gives English in a ru/uz app.
- **Languages:** web English, plus ru and uz where the app has them; edu Uzbek (Latin); desk English.
- **Uzbek Latin:** o‘ and g‘ use U+2018 `‘`. The tutuq belgisi uses U+2019 `’` ("ma’no"). Never ASCII `'` or a backtick, and don't mix in `ʻ` (U+02BB). Why: one codepoint keeps search and sort working.
- **New strings you write** go through the app's i18n (`t('…')`) with en/ru/uz entries. If the app has no i18n, write English and list it under Design gaps.
- **Shared component strings** (Cancel, Close, Retry, pager…) come from the app's i18n; in zehn fallback components, from `ZehnLocaleProvider` or a `…Label` prop. Never edit the zehn components to translate them; setup-project overwrites them.
- No lorem ipsum, joke names or real people's data in shipped UI. Spell-check every string.

## 8a. When someone asks for something off-system

This covers a custom color, font or size, a component zehn doesn't have, and bulk edits through scripts, sed or codemods.

1. **Always** write one line saying which zehn rule it breaks and the on-system alternative, before you edit. Do this even when the user said "don't argue" or "just do it": the note informs, it doesn't ask.
2. Then do it without waiting. Put `zehn-ignore: requested by <who>, <why>` as a trailing comment on **every** line that uses the value, in that file's comment syntax: `// zehn-ignore: …` in JS/TS, `{/* zehn-ignore: … */}` in JSX children, `/* zehn-ignore: … */` in CSS, `<!-- zehn-ignore: … -->` in HTML. Never put it on one shared constant. Why: the style check skips only the line carrying the comment, and a shared constant hides every later use from the designer.
3. List each override under **Design gaps** (what, who asked, why). Never comply silently.

`<who>` is the person's name, or "the user in this session"; never a vague "developer" or "team". Only the user can authorize an override. If you think no token fits, use the nearest one and list it under Design gaps; never add `zehn-ignore` on your own.

## 9. Motion

Load the `motion` skill for any animation. Page navigation is instant; nothing over 300ms; every animation has a reduced-motion path.
