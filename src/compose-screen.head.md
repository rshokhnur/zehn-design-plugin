---
name: compose-screen
description: Build a new zehn screen, page, flow, modal or drawer, or restructure an existing layout, from a Figma link or composed from patterns. Holds the full rules, component catalog and tokens; works through the app's own components via zehn.project.json. For edits that keep the current layout (a button, column, field, badge, copy, spacing) use ui-tweak. To review a PR or migrate an old page to zehn use ui-review.
---

# Compose a screen the zehn way

Wrong skill? If the change adds no screen, modal, drawer or flow and keeps the current layout, use `ui-tweak`. Migrating an old page to zehn: `ui-review`.

The references below this workflow:
- **REFERENCE: zehn UI/UX rules**: who wins, layout, screen types, forms, copy and formats, off-system requests
- **REFERENCE: zehn component catalog**: what ships, the real props, and what to build
- **REFERENCE: zehn tokens cheat sheet**: which token or class to use for what

When sources disagree, follow "Who wins" at the top of the rules (one order for layout, one for values).

## Step 1: Context
1. **Read `zehn.project.json`** at the app root: the components, tokens and example screens to use. Missing → run `setup-project` before anything else.
2. **Which app?** `app` in `zehn.project.json` (`app.modules` for a module), else the repo's `data-app`. It sets the accent (rules §0). Still unclear: ask the developer (rules, "Ask the developer"). Read `decisions` too: forks already answered.
3. **Figma design?** Look for a figma.com link in the task, ticket or PR description.
4. **Platform:** web (1440 desktop) or mobile (edu, desk: 402 iOS).

## Step 2a: With a Figma link
0. **A big link** (a page, a section, or a frame with many screens): never call `get_design_context` or `get_screenshot` on it. `get_metadata` on a page returns every nested layer (~70k chars), so take only the root's direct children: the lines one indent level below the root, their `name` and `id`, ignoring everything nested. Ask the developer which ones to build (one question, options = frame groups, the core flow recommended). Save the answer under `decisions`, then read only those frames, one at a time.
1. Load figma:figma-design-to-code as it requires, then read the exact node (`get_design_context`, `get_screenshot`). Where it conflicts with this skill, this one wins: no downloaded icons, header art or component images (use the app's icon set, mapped components and `HeaderPattern`); download only real photos or illustrations. Why: downloaded assets are frozen copies that don't follow dark mode, the app accent or later redesigns.
2. The generated code is a reference only: map each element to a mapped component and each value to a project token (`tokens.figmaMap`). Never paste raw styles.
3. Copy the page structure of the example screen mapped for this screen type (`screens`) and fill it with the frame's content. Build what the frame shows for this task, plus the states and motion in Step 2c. Actions, filters or screens the frame shows beyond the task go under Suggestions; don't ask about them.
4. A value in the frame differs from the rules or a mapped component → apply "Who wins" and add the Design gaps line.

## Step 2b: No design
1. Look at the sibling screens in this app first. Then pick the screen type, the create/edit container (rules §3) and the content width (rules §2) as defaults where the siblings don't decide.
2. Copy the layout of the example screen mapped for that type (`screens` in `zehn.project.json`), or the closest existing screen. Match the sibling screens: their shell, header, cards or list, and widths come first. The zehn recipes are defaults; deviate only as "Rules vs layout defaults" allows, with a `Layout: <what>, <why>` line under Design gaps.
3. Components: catalog, "Which component" (mapped, then `fallback.zehnDir` when set, then build once). List the mapping's `gaps` for each component you use under Design gaps. Never invent a component, variant or style.
4. A real fork (rules, "Ask the developer": forks 3 and 4)? Ask once, recommended option first, and save the answer under `decisions`.

## Step 2c: States and motion (both paths)
1. Design every state of what was asked: empty, loading (Skeleton, Button `loading`), validation error, success toast, permission (`disabledReason`), destructive confirm. States, yes; new features, no: extra actions, filters, stats or statuses go under Suggestions (rules, "The project map").
2. Motion: only what the mapped components already do, plus the `motion` skill patterns where something opens, closes or changes (load it). Page navigation is instant.

## Step 3: Before you finish
The zehn style check runs on each Edit/Write and once when you finish. Edits made through Bash, sed or python are seen only at the finish, so after one, check the file yourself: `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-ui.js" <file>` (it checks the whole file; judge only your lines). Fix every line it reports, or mark a user request per rules §8a, and re-run it until it prints "clean".
- [ ] Only the project's tokens; no hex, unlisted Tailwind colors or arbitrary `[...]` values.
- [ ] Only mapped (or fallback) components; no new component, variant or style.
- [ ] Only what was asked; shared components untouched (or listed as a design-system change). Ideas under Suggestions.
- [ ] Same shell, header and width as the sibling screens; any deliberate difference has a `Layout:` line under Design gaps.
- [ ] One primary per surface (rules §4). Accent only in the rules §0 list.
- [ ] Badges use `status` by meaning. Destructive actions open an AlertDialog.
- [ ] Copy and formats per rules §8.
- [ ] Works in dark mode. Motion follows the `motion` skill and has a reduced-motion path.

## Off-system requests
Follow rules §8a exactly, including for sed, scripts and codemods.

## Step 4: Design gaps
Always end with **Design gaps** (plus **Suggestions** if you had ideas beyond the ask): every decision the rules didn't cover, every place a lower source lost (`<element>: Figma <value>, used <value> (why)`), every component you built from the catalog, and every `zehn-ignore` (what, who asked, why). Write "Design gaps: none" if there are none. Put the same list in the commit message or PR body, so the designer can see it in the repo.
