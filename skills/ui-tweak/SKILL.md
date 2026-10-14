---
name: ui-tweak
description: Small change to an existing zehn screen (add or change a button, column, field, badge, tooltip, copy, spacing or color). Short zehn rules card. For a new screen, flow, modal or drawer use compose-screen instead.
---

# Small UI change, the zehn way

Use this for edits that keep the screen's layout. If you're adding a new screen, modal, drawer or flow, load `compose-screen` instead.

1. **Reuse what's there.** Find the shared zehn components (`src/components/zehn/` or the app's UI folder) and copy how the same screen already does it. Never inline a new button, badge, input or tooltip. If a component is missing, copy it from the plugin's `components/react/` (via `setup-tokens`), don't hand-roll it.
2. **Tokens only.** Classes from the zehn preset or `var(--zm-*)`. No hex, rgb, named colors, `blue-500`, or `[...]` values.
   - Spacing (Tailwind keys): `0 px 0.5 1 1.5 2 2.5 3 4 5 6 8 10 12 16 18 24 32` (`p-4` = 16px, `gap-3` = 12px).
   - Radius: `rounded` 4 (cards, panels, tables, badges), `rounded-lg` 8 (buttons, inputs), `rounded-2xl` 16 (mobile cards), `rounded-full`. Shadows: `shadow-100/200/300`.
   - Text: `text-xs` 12 (meta), `text-sm` 14 (body, buttons), `text-base` 16, `text-lg` 18, `text-2xl` 24 (H1). `font-normal` / `font-semibold` only.
   - Color: `text-text-primary/secondary/tertiary`, `bg-surface-base/subtle/raised`, `border-border-default`, `bg-primary-bg text-primary-fg`, `text-status-{success,warning,info,danger,neutral}` + `bg-status-*-bg`, `bg-disabled-bg text-disabled-fg`.
3. **Buttons.** `<Button variant="primary">` is black and appears once per view, last on the right. `secondary` for Cancel/other, `ghost` for toolbar/nav, `color-primary` (green) for Approve only, `destructive-secondary` for Reject/Withdraw (opens an AlertDialog), `ai-*` for AI only. Icon-only → `IconButton` with `aria-label`.
4. **Badges** are tinted with an icon and use status meaning (green done, peach/orange waiting, blue in progress, red failed, neutral inactive). Never the app accent.
5. **Copy.** Sentence case. `30.06.2026`, `30.06.2026 14:27`, `24,000,000 UZS` (ru/uz `24 000 000 UZS`) via the shared `format*` helpers, `#REQ-3`, ` · ` separators. Short, second person. Shared components take labels from `ZehnLocaleProvider`; don't hard-code or edit them.
6. **States.** Anything destructive opens an `AlertDialog`. Disabled actions say why (Tooltip). New async actions get loading + success/error `Toast`.
7. **Dark mode** must still work (it will, if you only used tokens).
8. **Off-system requests** (also bulk edits via sed or scripts): say which rule it breaks and offer the zehn way; if they insist, add `zehn-ignore: requested by <who>, <why>` on every line using it and list it under **Design gaps** in your final message.

If the change needs something the rules don't cover (a new pattern, an unclear state), do the closest zehn thing and list it under **Design gaps**.
