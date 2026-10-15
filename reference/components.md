# zehn component catalog

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
