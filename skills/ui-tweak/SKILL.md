---
name: ui-tweak
description: An edit to an existing zehn screen that keeps its layout - add, fix or restyle a button, column, field, badge, tooltip, copy, spacing, color or a small transition. Uses the app's own components and tokens via zehn.project.json. For a new screen, page, flow, modal or drawer, or a layout change, use compose-screen. To review a PR or migrate an old page, use ui-review.
---

# Small UI change, the zehn way

Use this for edits that keep the screen's layout. Adding a screen, modal, drawer or flow, or changing the layout: load `compose-screen`. Conflicts on a value: the user's request (via step 9, "Off-system requests") > the project's tokens and mapped components > Figma (component, then frame) > sibling screens > catalog. On layout: the siblings first, then Figma. Still unsure on a value: follow Figma.

1. **Read `zehn.project.json`** (app root; missing → `setup-project`). Use the components mapped in `zehn.project.json` first (their names, imports and props), then the zehn fallback components (`fallback.zehnDir`), then build from the catalog spec with the app's primitives. Copy how the screen already does it, unless that code uses hex, raw elements or unmapped components; then write your new lines the right way and leave the rest alone. Never invent a component, variant or style; never hand-roll a button, badge, input or tooltip. List a mapping gap only when your change makes it visible (a new instance on a screen, or a prop the gap affects). `className` on a component: layout, width and margin only (full rule: `${CLAUDE_PLUGIN_ROOT}/reference/components.md`, top).
2. **The project's tokens only** (`tokens` in `zehn.project.json`). No hex, rgb, named colors, unlisted Tailwind colors or `[...]` values. The class names below are the zehn fallback; in an app with its own theme use its token for the same role.
   - Spacing: the project's `spacingKeys`, else the zehn Tailwind keys (`p-4` = 16px, `gap-3` = 12px); the style check lists the allowed ones.
   - Radius: `rounded` 4 (cards, panels, tables, banners, toasts, badges, small buttons), `rounded-lg` 8 (buttons, inputs, menus), `rounded-xl` 12 (modals), `rounded-2xl` 16 (mobile cards), `rounded-full`.
   - Shadows: web cards have a border and no shadow. `shadow-100` raised controls · `shadow-200` tooltips, toasts · `shadow-300` menus, modals, drawers.
   - Text: `text-xs` 12 (meta), `text-sm` 14 (body, buttons), `text-base` 16, `text-lg` 18, `text-2xl` 24 (H1). `font-normal` / `font-semibold` only.
   - Color: `text-text-primary/secondary/tertiary`, `bg-surface-base/subtle/raised`, `border-border-default`, `bg-primary-bg text-primary-fg`, `text-status-*` + `bg-status-*-bg`, `bg-disabled-bg text-disabled-fg`. Never `const-white`, `const-black` or `gray-*` for surfaces or text: they don't flip in dark mode.
3. **Buttons.** `primary` is black, one per surface (page, modal, drawer each count), last on the right; on mobile it's the full-width bottom CTA. `secondary` for Cancel and other actions, `ghost` for toolbar and nav, `color-primary` (green) for Approve only, `destructive-secondary` for Reject or Withdraw (opens an AlertDialog), `ai-*` for AI only. Icon-only → `IconButton` with `aria-label`.
   - Asked for a red or colored button? A destructive action → `destructive-secondary` + AlertDialog. Anything else is off-system (step 9, "Off-system requests").
   - Page header actions: up to 2 `secondary` buttons, then a `…` IconButton Menu for the rest, then the `primary`.
   - Mobile FAB: zehn has none. It's off-system (step 9, "Off-system requests"); offer the bottom CTA.
4. **Badges:** `<Badge status="success|warning|info|danger|neutral">` by meaning (done, waiting, in progress, failed, inactive). Never the app accent, and never on "recommended" cards either.
5. **Copy.** Sentence case, short, second person. Format dates and money with the app's formatters, or zehn's `formatDate`, `formatDateTime`, `formatMoney`, `formatNumber`, `formatDuration` with `useZehnLocale()` (they default to English). New strings go through the app's i18n with en/ru/uz entries; if there is none, write English and list it under Design gaps. Uzbek: o‘/g‘ use `‘` (U+2018), never ASCII `'`.
6. **States.** Anything destructive opens an `AlertDialog`. A disabled action says why: `disabledReason="…"` on the zehn Button or IconButton (it stays focusable and shows a Tooltip; plain `disabled` can't). With a mapped Button, keep it focusable with `aria-disabled` and wrap it in their Tooltip. A Tooltip's child must be focusable. New async actions get `loading` plus a success or error Toast.
7. **Only what was asked.** No extra actions, statuses or chips, here or on neighbouring screens; ideas go under Suggestions. Don't restyle a shared component for one screen (the style check flags edits there).
8. **Motion:** hover and press only `duration-fast` with named properties (`transition-colors`, `transition-transform`), never `transition-all` or over 300ms. Anything that opens, closes or moves: load the `motion` skill.
9. **Off-system requests** (bulk sed or script edits too): follow the off-system steps in the session rules exactly. One line first, even after "don't argue"; then `zehn-ignore: requested by <who>, <why>` on every line; then Design gaps.

End with **Design gaps** (or "Design gaps: none"): overrides, anything the rules don't cover, and every place Figma or the catalog lost.
