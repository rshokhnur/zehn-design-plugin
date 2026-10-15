# zehn UI/UX rules

When reading Figma, use only the styles and components local to file `ywFHunM35gYeHJozrBJpZO` (zehnmind). Ignore remote library copies.

## The project map

zehn is a guardrails layer over the app's own design system. `zehn.project.json` at the app root (written by setup-project) maps the app's tokens, components and example screens to the Figma variables and this catalog. For every UI change:

1. Read `zehn.project.json`.
2. Use its mapped components (their names, imports and props) and its tokens (`tokens.sources`, `tailwindColors`; Figma variables through `tokens.figmaMap`).
3. Copy the layout of the example screen mapped for the screen type (`screens`), or the closest existing screen.
4. Never invent a component, variant or style. If one is truly needed, build it from their existing primitives in their style and list it under Design gaps.
5. **Build only what was asked.** No extra actions, filters, stats, pagers, statuses or chips on neighbouring screens. Ideas go under **Suggestions** in your message, not in the code. Keep the data meaning the user gave you (withdraw sets a status, it doesn't delete). Why: the designer and the team decide scope; extra UI is drift too.
6. **Don't edit the shared components** (`components.dir` and the mapped imports) to restyle one screen. A change there changes every screen: only when the user asked for it, and list it under Design gaps as "design-system change, designer sign-off needed". The style check flags every edit there.

zehn class names and `--zm-*` tokens in these rules describe the zehn fallback (used when `fallback.zehnTokens` is true). In an app with its own tokens, read them as "the project's token for this Figma variable". The rules themselves (widths, order, which element gets which radius, formats) apply either way.

## Who wins

When two sources disagree on anything (a value, a component, a layout), walk this list from the top and stop at the first one that decides:

1. **An explicit request from the user in this session.** Only through the off-system protocol (§8a): one-line note, then `zehn-ignore` on each line, then Design gaps.
2. **The designer's hard decisions in these rules:** the project's tokens only; primary always black; accent only in its allowed list (§0); ghost-tab nav (§2); content widths (§2); modal vs drawer (§3); sentence case, date and money formats (§8); Alert Dialog before destructive actions (§5). Why: these were decided on purpose and beat old Figma frames.
3. **Figma:** first the Figma component (page `UI Elements`) and the project's mapped component that mirrors it (`zehn.project.json`), then the Figma frame for the screen.
4. **The app's existing sibling screens** (the mapped example screen and the screens next to the one you're building). If they lack a catalog pattern (HeaderPattern, a stat-card row, a page header layout), match the siblings and list the missing pattern under Design gaps, so the designer can roll it out everywhere at once. Why: one new page that looks different from its neighbours is worse than all of them missing a pattern.
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

Anything else is off-system: buttons, badges, counters, links, selection, body text, "recommended" or highlighted cards. Use Neutral or a status color there. The Switch "on" color is Cyan in every app; it's a component color, not the accent.

| App (`data-app` value) | Accent |
|---|---|
| procurement, intelligence, desk | `Cyan` |
| hr, tasks, analytics, edge | `Orange` |
| docs | `Blue` |
| geo | `Yellow-Green` |
| edu | `Edu Green` (`--zm-edu-green*`) |

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
- **Never pill buttons or inputs, never gradients.** Buttons and inputs use the radius table above. The AI gradient lives only in the AI components.

## 1a. Craft details
Small things the components can't do for you:
- **Numbers:** money, counts, IDs and dates in tables and stat cards use `tabular-nums`; number columns align right, with their header.
- **Text:** long prose (descriptions, comments, help) stops at about 65 characters a line (`max-w-prose`). Headings that wrap get `text-balance`. Type the ellipsis `…`, never `...`; truncate with `truncate` plus a Tooltip with the full value. No italics or underlines for emphasis (underline means a link); use `font-semibold`.
- **Spacing:** space siblings with `gap` (or `space-y-*`) on the parent, not margins on each child. A rounded element inside a rounded one: inner radius = outer radius − padding (or 0).
- **Disabled:** the disabled tokens (`bg-disabled-bg text-disabled-fg`), never `opacity-50` on a control.
- **Focus:** never remove the focus ring without a replacement (`outline-none` only together with `focus-visible:shadow-focus` or the app's ring).
- **Icons:** one icon set per app. One icon, one meaning (a chevron that expands doesn't also navigate). 8px between an icon and its label (the components do this).
- **Clickable things** are `<button>` or `<a>`, never `<div onClick>`. Don't wrap a whole card in one `<a>`: make the title the link (and stretch it over the card if needed).

## 2. Desktop shell (all web apps)

- **Top bar:** 56px, `bg-surface-base`, 1px bottom `border-border-default` (`TopBar`).
  - Left: logo `zehn` + `/app` in the accent, a 1×16 divider, then nav as **ghost tabs** (ghost Button, icon + label). The active tab gets the subtle fill.
  - Right: bell IconButton + red Counter, a divider, a ghost "Support" button and the avatar.
  - No sidebars. No Segmented Control as navigation.
- **Page header** (`PageHeader`, list and overview pages): 2px accent bar, 32px accent icon, H1 `text-2xl font-semibold`, a gray subtitle with live counts ("1 request waiting on you"). `HeaderPattern` sits behind its top right.
  - Actions on the right, in this order: up to 2 `secondary` buttons, then a `…` IconButton Menu for the rest, then the one `primary`.
  - Export is a `secondary` button labeled "Export" with the `download-2` icon. When it offers formats, it opens a Menu ("Export as CSV", "Export as XLSX"). File name: `{app}-{items}-{dd.mm.yyyy}.csv`, e.g. `procurement-requests-30.06.2026.csv`.
- **Detail header** (`DetailHeader`): back IconButton or "< All {items}" link, `#ID` (`text-xs`, gray), the title, a meta row (avatar + name · Submitted 01.06.2026 · Needed by 30.06.2026 (in 28 days)), a `…` menu on the right, a divider below.
- **Content width.** Pick by what the page shows:
  - Columns aligned across rows (a table), a board, a builder or charts → full width, 24px gutters (`px-6`, no max width).
  - The detail of one object → 896 centered (`max-w-column-detail mx-auto`): 560 main + 16 gap + 320 side column.
  - Everything else (card feeds, inbox rows, settings, a form on a page) → 768 centered (`max-w-column-narrow mx-auto`).

## 3. Screen types

| Type | Recipe |
|---|---|
| Table list | page header → optional stat-card row (3–5, first `highlighted`) → toolbar → full-width DataTable |
| Card feed | page header → search → filter chips → cards (768 column) |
| Detail | detail header → 560 main + 320 side panels (Details, People, Activity) |
| Builder | 64px sub-bar (Back, title, Preview, Publish) + 240 palette + canvas + 320 inspector |
| Board | kanban columns of TaskCard |
| Dashboard | rows of chart cards and stat cards |
| Empty | keep the header, search and filters; `EmptyState` centered with a title, one line and an optional small button |

**Create/edit container.** Walk this in order:
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

Use the components mapped in `zehn.project.json` first, then the zehn fallback components (`fallback.zehnDir`), then build from the catalog spec with the app's primitives. Never rebuild a Button, Badge, Input, Avatar, Menu, Toast or Empty State. Button variants and their uses: see the catalog, Button.

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
- The zehn intelligence assistant uses the orb (default / listening / thinking), a 64px launcher bottom-right, and accent send button and chat bubbles. Don't use the orb anywhere else.

## 8. Copy and formatting

- **Sentence case** everywhere: buttons, titles, tabs, menus ("Create board", "Submit for approval").
- **Tone:** short, friendly, second person ("Your requests", "Tell us what you need."). No "please" in buttons and prompts.
- **Specific labels:** buttons say the outcome ("Save changes", "Send for approval"), never "Submit", "OK" or "Yes". Errors say how to fix it ("Enter an amount above 0"), never "Invalid input" or "Something went wrong" alone. Put the important word first.
- **Empty and error states** say why and what to do next, with the action as a button ("You haven't created a request yet" + "New request"). Error pages name what failed and offer a specific way out (Retry, Go to requests).
- **Dates:** `30.06.2026`. Date-time: `30.06.2026 14:27` (24h). Ranges: `12.01.2026 – 31.01.2026 · 10 days`. Add relative time next to deadlines: "(in 28 days)". Same in every locale.
- **Money:** en `24,000,000 UZS`; ru and uz `24 000 000 UZS` (non-breaking space, decimal comma). The currency code stays `UZS`, after the number.
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
