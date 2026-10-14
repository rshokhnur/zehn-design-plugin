# zehn React components (reference)

Reference implementations of the components in `reference/components.md`: React 18 + TypeScript + Tailwind v3 with the zehn preset. Only `react` is needed, with no other runtime dependencies.

## Setup

1. Copy this folder into your app as `src/components/zehn/`.
2. `npm i remixicon` and import `remixicon/fonts/remixicon.css` once.
3. Add the preset to `tailwind.config` (`presets: [require('./tokens/tailwind.preset.cjs')]`, Tailwind **3.4+**) and include `src/components/zehn/**/*.tsx` in `content`.
4. Import `tokens/tokens.css` once. Dark mode and per-app accents (`data-app="hr"`) come from its CSS variables.

Icons are Remix names without prefix/suffix: `icon="close"` renders `ri-close-line`.

## What's here

| Group | Components |
|---|---|
| Actions | `Button`, `IconButton`, `Counter` |
| Display | `Badge`, `Avatar`, `AvatarGroup`, `EmptyState`, `Skeleton`, `ProgressBar`, `Tooltip` |
| Inputs | `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch` |
| Navigation | `SegmentedControl`, `Menu`, `FilterChips` |
| Feedback | `ToastProvider` / `useToast`, `Modal`, `Drawer`, `AlertDialog` |
| Layout | `TopBar`, `PageHeader`, `DetailHeader`, `StatCard`, `PanelCard`, `DataTable`, `Toolbar` + `Pager`, `InfoChip`, `ActivityFeed` + `ActivityItem` |
| Helpers | `cx`, `Icon`, `buttonClass`, `useControllable`, `useDialog` |

## Usage

```tsx
import { Button, Modal, AlertDialog, Input, useToast } from '@/components/zehn';

<Button variant="primary" leftIcon="add">New request</Button>
<Button variant="secondary" size="small" leftIcon="add">Add</Button>
<Button variant="primary" loading={saving}>Save</Button>
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
```

## Notes

- `Button` uses `variant` (Figma calls it `style`). AI variants add a sparkle icon by default; `leftIcon={null}` removes it.
- `Menu` takes an `items` array and always moves `destructive` items last, after a divider.
- `Modal`, `Drawer` and `AlertDialog` render in place (no portal) as `fixed` overlays. They trap focus, close on Escape and return focus to the opener. `AlertDialog` focuses Cancel and ignores scrim clicks.
- `ProgressBar` sets its fill width with an inline `style` percentage, because the width is data.
