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

Important: the zehn Tailwind preset REPLACES Tailwind's defaults. Spacing keys are pixels (`p-16` = 16px, `p-6` = 6px), there are no `blue-500`-style colors, and radius is `rounded-4/8/12/16/full`.

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
3. Compose ONLY from existing components and the patterns in the component catalog ("Not yet library components"). Build a missing pattern once as a shared component; never inline it.
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

## Step 4: Report design gaps
If there was no Figma design, end your message with a short **Design gaps** list: every decision you made that the rules didn't cover (new pattern, unclear copy, missing state), so the designer can review. If you had to keep a value with `zehn-ignore`, list it there too.

## If the codebase has no tokens yet
Run the `setup-tokens` skill first.
