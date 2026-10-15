---
name: compose-screen
description: Build a new zehn screen, page, flow, modal or drawer, or restructure an existing layout, from a Figma link or composed from patterns. Holds the full rules, component catalog and tokens; works through the app's own components via zehn.project.json. For edits that keep the current layout (a button, column, field, badge, copy, spacing) use ui-tweak. To review a PR or migrate an old page to zehn use ui-review.
---

# Compose a screen the zehn way

You are building UI for a zehn app. Make the result look like the designer made it.

Wrong skill? If the change adds no screen, modal, drawer or flow and keeps the current layout, use `ui-tweak`. Migrating an old page to zehn: `ui-review`.

The references below this workflow:
- **REFERENCE: zehn UI/UX rules**: who wins, layout, screen types, forms, copy and formats, off-system requests
- **REFERENCE: zehn component catalog**: what ships, the real props, and what to build
- **REFERENCE: zehn tokens cheat sheet**: which token or class to use for what

Animation work: load the `motion` skill too.

When sources disagree, follow "Who wins" at the top of the rules. When unsure, follow Figma.

## Step 1: Context
1. **Read `zehn.project.json`** at the app root: the components, tokens and example screens to use. Missing → run `setup-project` before anything else.
2. **Which app?** (procurement, hr, tasks, docs, edge, analytics, geo, intelligence, edu, desk). It sets `data-app` and the accent. If you can't tell, ask.
3. **Figma design?** Look for a figma.com link in the task, ticket or PR description.
4. **Platform:** web (1440 desktop) or mobile (edu, desk: 402 iOS).

## Step 2a: With a Figma link
1. Load figma:figma-design-to-code as it requires, then read the exact node (`get_design_context`, `get_screenshot`). Where that skill conflicts with this one, this one wins: no downloaded icons, header art or component images (use the app's icon set and mapped components, and `HeaderPattern` where the app has no header art), and no generated styles (map every value to the project's token through `tokens.figmaMap`). Why: downloaded assets are frozen copies that don't follow dark mode, the app accent or later redesigns. Download only real photos or illustrations that exist nowhere else.
2. Treat the generated code as a reference only. Map each element to a mapped component and each value to a project token. Never paste raw styles.
3. Copy the page structure of the example screen mapped for this screen type (`screens`) and fill it with the frame's content. Build what the frame shows for this task; frames often show extra states or actions, so ask or list them under Suggestions before building them.
4. A value in the frame differs from the rules or a mapped component → apply "Who wins" and add the Design gaps line.

## Step 2b: No design
1. Pick the screen type and the create/edit container (rules §3) and the content width (rules §2).
2. Copy the layout of the example screen mapped for that type (`screens` in `zehn.project.json`), or the closest existing screen. Match the sibling screens: if they lack a catalog pattern (HeaderPattern, stat cards), leave it out and list it under Design gaps (rules, Who wins 4).
3. Use the components mapped in `zehn.project.json` first (their names, imports and props), then the zehn fallback components (`fallback.zehnDir`), then build from the catalog spec with the app's primitives. List the mapping's `gaps` for each component you use under Design gaps. Never invent a component, variant or style; if one is truly needed, build it once from their primitives in their style (catalog intro) and list it.
4. Design every state of what was asked: empty, loading (Skeleton, Button `loading`), validation error, success toast, permission (`disabledReason`), destructive confirm. States, yes; new features, no: extra actions, filters, stats or statuses go under Suggestions (rules, project map 5).
5. Motion: only what the mapped components already do, plus the `motion` skill patterns where something opens, closes or changes. Page navigation is instant.

## Step 3: Before you finish
The zehn style check runs after every edit and again before you finish (Bash and sed edits included). Fix every line it reports, or mark a user request per rules §8a. Don't finish while it reports issues.
- [ ] Only the project's tokens; no hex, unlisted Tailwind colors or arbitrary `[...]` values.
- [ ] Only mapped (or fallback) components; no new component, variant or style. The layout matches the mapped example screen and its siblings.
- [ ] Only what was asked; shared components untouched (or listed as a design-system change). Ideas under Suggestions.
- [ ] Shell: 56px top bar with ghost tabs; list and overview pages have PageHeader + HeaderPattern; detail pages have DetailHeader; width per rules §2.
- [ ] One primary per surface (rules §4). Accent only in the rules §0 list.
- [ ] Badges use `status` by meaning. Destructive actions open an AlertDialog.
- [ ] Copy and formats per rules §8, through the app's formatters (or zehn's `format*`) with the locale.
- [ ] Works in dark mode. Motion follows the `motion` skill and has a reduced-motion path.

## Off-system requests
Follow rules §8a exactly, including for sed, scripts and codemods.

## Step 4: Design gaps
Always end with **Design gaps** (and **Suggestions** if you had ideas beyond the ask): every decision the rules didn't cover, every place a lower source lost (`<element>: Figma <value>, used <value> (why)`), every component you built from the catalog, and every `zehn-ignore` (what, who asked, why). Write "Design gaps: none" if there are none.
