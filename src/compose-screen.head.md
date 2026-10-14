---
name: compose-screen
description: Build or change any zehn UI (screen, flow, modal, drawer, component, or styling) on the zehn design system, from a Figma link or composed from existing patterns when there is no design. Use for all frontend/UI work in zehn apps.
---

# Compose a screen the zehn way

You are building UI for a zehn app. Figma is the source of truth. Your job is to make the result look like the designer made it.

The full references are included BELOW this workflow:
- **REFERENCE: zehn UI/UX rules**: layout, screen types, patterns, forms, copy, formats
- **REFERENCE: zehn component catalog**: every component, its props, and the not-yet-componentized patterns
- **REFERENCE: zehn tokens cheat sheet**: which token or class to use for what

Important: the zehn Tailwind preset replaces colors, radius, font sizes/weights and shadows, and keeps Tailwind's standard spacing keys (`p-4` = 16px). Only the zehn spacing subset is allowed: `0 px 0.5 1 1.5 2 2.5 3 4 5 6 8 10 12 16 18 24 32`. There are no `blue-500`-style colors, no `shadow-lg`, no `rounded-md`.

For a small change to an existing screen, the shorter `ui-tweak` skill is enough.

## Step 1: Figure out the context
1. **Which app?** (procurement, hr, tasks, docs, edge, analytics, geo, intelligence, edu, desk). That sets `data-app` and the accent. If you can't tell, ask.
2. **Is there a Figma design?** Look for a figma.com link in the task, ticket or PR description.
3. **Platform:** web (1440 desktop) or mobile (edu/desk, 402 iOS).

## Step 2a: With a Figma link
1. Use the Figma MCP (`get_design_context`, `get_screenshot`, `get_variable_defs`) on the exact node.
2. Treat the generated code as a **reference only**. Map every element to an existing component (catalog below) and every value to a token (cheat sheet below). Never paste raw styles from it.
3. Where the Figma frame and the rules differ (e.g. an old screen with a blue primary button), the **rules win**. Note the difference in your final message.

## Step 2b: No design (compose from patterns)
1. Pick the screen type from the table in the UI/UX rules §3 (table list, card feed, detail, modal, drawer, builder, board, dashboard, empty).
2. Find the closest existing screen in the codebase that already follows these rules, and reuse its layout and shared components.
3. Compose ONLY from the shared zehn components (`src/components/zehn/`; if the app doesn't have them, copy them in from the plugin's `components/react/` with `setup-tokens`). For a pattern that isn't there yet, build it once as a shared component following the catalog spec; never inline it.
4. Copy: sentence case, short, friendly, second person. Formats: `30.06.2026`, `30.06.2026 14:27`, `24,000,000 UZS`, `#REQ-3`, ` · ` separators.
5. Design every state, not just the happy path: empty, loading (skeleton / Button loading), validation error, success toast, permission-denied (disabled + reason), and a destructive confirm.

## Step 3: Checklist before you finish
- [ ] No hex/rgb, no default Tailwind palette, no arbitrary `[...]` values. Only `--zm-*` tokens or zehn preset classes.
- [ ] Only existing components; no new button, badge or input variants.
- [ ] Shell: 56px top bar with ghost tabs, page header with the accent bar and icon, correct content width (full width for tables/dashboards, 768 for feeds/settings, 896 for detail).
- [ ] One primary (black) button per view, placed last on the right.
- [ ] Status badges are tinted with an icon and use the status color meaning, never the app accent.
- [ ] Forms: labels above, red `*` for required, errors under the field, Cancel + primary in the footer.
- [ ] Destructive actions open an Alert Dialog.
- [ ] Works in dark mode (`data-theme="dark"`).
- [ ] Inter 400/600 only; Remix `-line` icons.

## When the user asks for something off-system
Say in one line which rule it breaks and offer the zehn alternative. If they still want it (or said "don't argue"), do it with `zehn-ignore: requested by <who>, <why>` on EVERY line that uses the value (never one ignored constant reused everywhere), and list each override under Design gaps. Never comply silently.

## Step 4: Report design gaps
End your message with a short **Design gaps** list when there was no Figma design, or when you overrode anything: every decision the rules didn't cover (new pattern, unclear copy, missing state) and every `zehn-ignore` (what, who asked, why), so the designer can review.

## If the codebase has no tokens yet
Run the `setup-tokens` skill first.
