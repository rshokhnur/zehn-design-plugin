# zehn React components (reference)

The zehn React components from the catalog: React 18 + TypeScript + Tailwind 3.4+ with the zehn preset. Only `react` is needed at runtime.

## Setup

These are a fallback. The zehn-design plugin's `setup-project` skill maps the app's own components in `zehn.project.json` and copies here only the ones the app lacks (plus their helpers). Include `src/components/zehn/**/*.tsx` in Tailwind's `content`.

Icons are Remix names without prefix/suffix: `icon="close"` renders `ri-close-line`.

## What's here

| Group | Components |
|---|---|
| Actions | `Button`, `IconButton`, `Counter` |
| Display | `Badge`, `Avatar`, `AvatarGroup`, `EmptyState`, `Skeleton`, `ProgressBar`, `Tooltip`, `HeaderPattern` |
| Inputs | `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch` |
| Navigation | `SegmentedControl`, `Menu`, `FilterChips` |
| Feedback | `ToastProvider` / `useToast`, `Modal`, `Drawer`, `AlertDialog` |
| Layout | `TopBar`, `PageHeader`, `DetailHeader`, `StatCard`, `PanelCard`, `DataTable`, `Toolbar` + `Pager`, `InfoChip`, `ActivityFeed` + `ActivityItem`, `RoleBanner` |
| i18n | `ZehnLocaleProvider`, `useZehnLabels`, `useZehnLocale`, `formatDate`, `formatDateTime`, `formatMoney`, `formatNumber`, `formatDuration` |
| Helpers | `cx`, `Icon`, `buttonClass`, `useControllable`, `useDialog`, `usePresence`, `motionMs` |

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

- Radius per element is in the rules (radius table): cards, banners, toasts, badges and small buttons 4; buttons, inputs and menus 8; modals and alert dialogs 12.
- Built-in strings (Cancel, Close, Back, Retry, pager and notification labels, sr-only text…) come from `ZehnLocaleProvider` (`en` · `ru` · `uz`). Per-instance props such as `cancelLabel` still win.
- `Badge` matches Figma: tinted = `bg-{hue}-stroke text-{hue}`, filled = `bg-{hue} text-alpha-900`.

- `Button` uses `variant` (Figma calls it `style`). AI variants add a sparkle icon by default; `leftIcon={null}` removes it.
- `Menu` takes an `items` array and always moves `destructive` items last, after a divider.
- `Modal`, `Drawer` and `AlertDialog` render in place (no portal) as `fixed` overlays. Render them at page level, never inside a card, table or an element with `transform`, `filter` or `overflow-hidden`, or the overlay is clipped and mispositioned. They trap focus, close on Escape and return focus to the opener. `AlertDialog` focuses Cancel and ignores scrim clicks.
- `disabledReason` on `Button`/`IconButton` keeps the button focusable (`aria-disabled`), ignores clicks and shows the reason in a `Tooltip`. Use it instead of `disabled` when the user should learn why.
- `RoleBanner tone`: `accent` (the viewer must act), `info`, `warning` (view-only access). `Counter` has no accent color.
- `ProgressBar` positions its fill with an inline `style` transform percentage, because the value is data.

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

- `still` on `Button` / `IconButton` drops the press scale. Use it in dense, high-frequency UI: table row actions, toolbars, pagers. `DataTable` row actions and the `Pager` already use it.
- Reduced motion: the duration tokens become 0ms and the press scale 1, so everything changes instantly. Exits unmount at once (the wait is a timeout read from the token, not `transitionend`).
- A `Modal`, `Drawer` or `AlertDialog` that is open on its first render shows without animating. Toasts always animate in.
- `usePresence(open, exit, { appear })` is the shared hook for exit animations: it returns `{ mounted, state }`, mounts with `state: 'closed'`, flips to `'open'` two frames later, and on close keeps the element mounted for `exit` (`'fast'`, `'base'`, `'slow'` or ms). Style from `state` with plain classes (no `data-[…]` variants). Pass `open && mounted` to `useDialog` so focus moves in once the panel exists.
