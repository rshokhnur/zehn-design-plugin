# zehn React components (reference)

The zehn React components from the catalog: React 18 + TypeScript + Tailwind (v3 preset or v4 `@theme`). Only `react` is needed at runtime. Every class assumes zehn's color, radius, type, shadow and motion keys. In an app with its own theme, setup-project adapts each copy (motion tokens, `ZehnLocaleProvider labels`, colors through `tokens.figmaMap`). Never copy them into a non-Tailwind app (CSS Modules, styled-components): build from the catalog spec there.

## Setup

These are a fallback. The zehn-design plugin's `setup-project` skill maps the app's own components in `zehn.project.json` and copies here only the ones the app lacks (plus their helpers). Include `src/components/zehn/**/*.tsx` in Tailwind's `content`.

## What's here

| Group | Components |
|---|---|
| Actions | `Button`, `IconButton`, `Counter` |
| Display | `Badge`, `Avatar`, `AvatarGroup`, `EmptyState`, `Skeleton`, `ProgressBar`, `Tooltip`, `HeaderPattern` |
| Inputs | `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch` |
| Navigation | `SegmentedControl`, `Menu`, `FilterChips`, `AppSwitcher` |
| Feedback | `ToastProvider` / `useToast`, `Modal`, `Drawer`, `AlertDialog` |
| Layout | `TopBar`, `PageHeader`, `DetailHeader`, `StatCard`, `PanelCard`, `DataTable`, `Toolbar` + `Pager`, `InfoChip`, `ActivityFeed` + `ActivityItem`, `RoleBanner`, `ObjectCard` + `ObjectGrid` |
| AI | `Orb`, `OrbLauncher` (intelligence assistant only) |
| i18n | `ZehnLocaleProvider`, `useZehnLabels`, `useZehnLocale`, `formatDate`, `formatDateTime`, `formatMoney`, `formatNumber`, `formatDuration` |
| Helpers | `cx`, `Icon`, `buttonClass`, `useControllable`, `useDialog`, `usePresence`, `motionMs`, `setTheme`, `useTheme`, `RenderLink` |

## Usage

```tsx
import { Button, Modal, AlertDialog, Input, useToast } from '@/components/zehn';

<Button variant="primary" leftIcon="add">New request</Button>
<Button variant="secondary" size="small" leftIcon="add">Add</Button>
<Button variant="primary" loading={saving}>Save</Button>
<Button variant="secondary" disabledReason="Only the owner can close this board.">Close board</Button>
<Button variant="ghost" counter={3}>Inbox</Button>

<Modal
  open={open}
  onClose={() => setOpen(false)}
  icon="file-add"
  title="New request"
  subtitle="Tell us what you need."
  footer={<>
    <Button onClick={() => setOpen(false)}>Cancel</Button>
    <Button variant="primary" onClick={save}>Create request</Button>
  </>}
>
  <Input label="Title" required data-autofocus placeholder="e.g. Macbook Pro M5 for new design hire" />
</Modal>

<AlertDialog
  open={confirming}
  onClose={() => setConfirming(false)}
  onConfirm={withdraw}
  title="Withdraw request #REQ-3?"
  subtitle="Approvers will no longer see it."
  confirmLabel="Withdraw"
/>

// Wrap the app once in <ToastProvider>.
const { toast, update } = useToast();
toast({ type: 'success', title: 'Request sent' });
toast({ type: 'error', title: "Couldn't save", subtitle: 'Check your connection.', onRetry: save });
const id = toast({ type: 'loading', title: 'Uploading…' });
update(id, { type: 'success', title: 'Uploaded' });

// Locale: wrap the app once (outside ToastProvider). Without it everything is English.
<ZehnLocaleProvider locale={i18n.language as ZehnLocale} labels={{ support: 'Yordam markazi' }}>…</ZehnLocaleProvider>
const locale = useZehnLocale();
formatDate(d, locale);            // 30.06.2026
formatDateTime(d, locale);        // 30.06.2026 14:27
formatMoney(24000000, locale);    // en 24,000,000 UZS · ru/uz 24 000 000 UZS (U+00A0)
formatDuration(ms, locale);       // 14d 3h 22m

// List/overview page art, behind the content.
<main className="relative overflow-hidden">
  <HeaderPattern />
  <div className="relative">…</div>
</main>

<RoleBanner icon="shield-user" title="You're viewing as approver" description="You can approve or reject requests." actions={<Button size="small">Switch role</Button>} />
```

## Notes

- Radius per element: rules §1.
- Built-in strings (Cancel, Close, Back, Retry, pager and notification labels, sr-only text…) come from `ZehnLocaleProvider` (`en` · `ru` · `uz`). Per-instance props such as `cancelLabel` still win.

- `Button` uses `variant` (Figma calls it `style`). AI variants add a sparkle icon by default; `leftIcon={null}` removes it.
- `Menu` takes an `items` array and always moves `destructive` items last, after a divider.
- `Modal`, `Drawer` and `AlertDialog` render in place (no portal) as `fixed` overlays. Render them at page level, never inside a card, table or an element with `transform`, `filter` or `overflow-hidden`, or the overlay is clipped and mispositioned. They trap focus, close on Escape and return focus to the opener. `AlertDialog` focuses Cancel and ignores scrim clicks.
- `disabledReason` on `Button`/`IconButton` keeps the button focusable (`aria-disabled`), ignores clicks and shows the reason in a `Tooltip`. Use it instead of `disabled` when the user should learn why.
- `RoleBanner tone`: `accent` (the viewer must act), `info`, `warning` (view-only access). `Counter` has no accent color.
- `ProgressBar` positions its fill with an inline `style` transform percentage, because the value is data.

- `buttonClass({ variant: 'ghost', selected })` is the filled ghost (active nav tab); `TopBar` uses it with `aria-current="page"`. Never pass a `bg-*` through `className` to change a variant's fill: `cx` doesn't merge Tailwind classes, so both backgrounds end up in the class list and the variant's usually wins.

## Orb

The zehn intelligence assistant's orb: an ai-gradient sphere with a blurred glow. Only for the assistant (rules §7); the one place a gradient is allowed.

```tsx
<Orb state="thinking" size="hero" aria-label="zehn intelligence is thinking" />
<OrbLauncher aria-label="Ask zehn intelligence" onClick={openAssistant} aria-expanded={open} />
```

- `state`: `default` (glow the size of the core), `listening` (glow grows ~1.5× and pulses), `thinking` (glow grows and turns). The glow grows with a transform (slow, ease-in-out); the pulse and turn are `motion-safe:` loops, so they stop under reduced motion.
- `size`: `launcher` (64px) or `hero` (128px). Without `aria-label` the orb is hidden from screen readers (use that when text next to it names it).
- `OrbLauncher` is a real `<button>`, fixed `bottom-6 right-6`, `z-40` (under modals, drawers and toasts). `aria-label` is required. Toasts cover it while shown; that's intended, so don't move it.

## Theme

```tsx
setTheme('dark');                      // 'light' | 'dark' | 'system' (system removes data-theme)
const [theme, changeTheme] = useTheme();  // persisted to localStorage 'zehn-theme'
```

Transitions are switched off for the one frame of the switch, so hover fades don't animate the page into the new colors. `useTheme` starts as `'system'` and reads storage after mount (SSR safe); to avoid a flash on load, also set `data-theme` from storage in an inline `<head>` script.

## AppSwitcher

Cross-module list (zehn office): a 240px column, one row per module as `zehn/<name>`, each row in its own app accent (`data-app` per item).

```tsx
<AppSwitcher
  current="office"
  version="v2.4.0"
  apps={[
    { id: 'office', name: 'office', href: '/office', icon: 'building-2' },
    { id: 'meet', name: 'meet', href: '/meet', icon: 'video-chat', badge: 'Beta' },
  ]}
  renderLink={({ href, ...p }) => <Link to={href} {...p} />}
/>
```

The current app gets the neutral `bg-surface-subtle` fill, its `-fill` icon and `aria-current="page"`, never the accent fill. `badge` is a violet Badge. Rows are links, so the keyboard order is the normal tab order.

## ObjectCard

Card for grids of boards, dashboards and projects (Figma BoardCard): radius 4, 1px border, `bg-surface-raised`.

```tsx
<ObjectGrid>
  <ObjectCard
    title="Q3 procurement"
    href="/boards/12"
    description="Spend and approvals by department."
    meta="4 widgets · Updated 05.08.2026"
    footer={<AvatarGroup … />}
    menu={<Menu trigger={<IconButton icon="more-2" aria-label="Actions for Q3 procurement" />} items={…} />}
  />
</ObjectGrid>
```

- The title is the link (`href`, through `renderLink`) or a button (`onOpen`); its `::after` covers the card, so the whole card is clickable and the focus ring wraps the card. The `menu` sits above it and stays clickable. `footer` content is under the overlay, so keep it non-interactive.
- `accentBar` adds a 2px app-accent bar on top (task cards). Hover darkens the border (fast).
- `ObjectGrid`: 1 column, 2 from `sm`, 3 from `xl`, gap 16.

## Motion

Only `transform` and `opacity` animate (plus color on hover). Durations and easings come from the motion tokens: `duration-fast` (150ms), `duration-base` (200ms), `duration-slow` (300ms), `ease-out` for enters, `ease-in` for exits, `ease-in-out` for on-screen moves, `scale-press` (0.96).

| Component | Motion |
|---|---|
| `Modal`, `AlertDialog` | Scrim fades, panel fades and scales 0.95 → 1. Enter base + ease-out, exit fast + ease-in. No slide. |
| `Drawer` | Slides in from the right, slow + ease-out; out base + ease-in. Scrim fades in sync. Reopening mid-exit reverses from where it is. |
| `Menu` | Fades and scales 0.95 → 1 from the trigger's corner, fast. The keyboard highlight does not animate. |
| `Tooltip` | Fades and scales 0.95 → 1, fast, after its delay. While one is open, or closed under 300ms ago, the next opens at once with no animation. |
| Toasts | Rise 16px and fade in, base + ease-out. Dismissed: fade and drop 8px, fast + ease-in. |
| `Button`, `IconButton` | Hover colors fade (fast). Press scales to 0.96 while held, only when enabled. |
| `Switch` | Thumb slides, fast + ease-out. |
| `Checkbox`, `Radio`, inputs | Colors only. |
| `SegmentedControl` | Selection changes instantly. |
| `ProgressBar` | Fill moves with a transform, base + ease-out. |
| `Skeleton`, spinners | Pulse and spin; both stop under reduced motion. |
| `Orb` | Glow grows on listening/thinking (slow, ease-in-out); pulses while listening, turns while thinking. Loops stop under reduced motion. |
| `AppSwitcher`, `ObjectCard` | Colors only (fast). |

- `still` on `Button` / `IconButton` drops the press scale. Use it in dense, high-frequency UI: table row actions, toolbars, pagers. `DataTable` row actions and the `Pager` already use it.
- Reduced motion: the duration tokens become 0ms and the press scale 1, so everything changes instantly. Exits unmount at once (the wait is a timeout read from the token, not `transitionend`).
- A `Modal`, `Drawer` or `AlertDialog` that is open on its first render shows without animating. Toasts always animate in.
- `usePresence(open, exit, { appear })` is the shared hook for exit animations: it returns `{ mounted, state }`, mounts with `state: 'closed'`, flips to `'open'` two frames later, and on close keeps the element mounted for `exit` (`'fast'`, `'base'`, `'slow'` or ms). Style from `state` with plain classes (no `data-[…]` variants). Pass `open && mounted` to `useDialog` so focus moves in once the panel exists.
