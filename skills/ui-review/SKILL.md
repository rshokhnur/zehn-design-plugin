---
name: ui-review
description: Review UI code (the current diff, a PR or branch, or given files) against the zehn design system and fix violations, or migrate an old page to zehn. Use before opening a PR with UI changes, when asked "is this PR or screen on-style?", or when asked to migrate, restyle or convert a legacy page to zehn.
---

# zehn UI review and migration

0. **Read `zehn.project.json`** (app root): the mapped components, tokens and example screens are the standard you review against. Missing → `setup-project` first.
1. **Find the files.** Changed UI files: `git diff --name-only $(git merge-base HEAD origin/main)` plus `git ls-files --others --exclude-standard` (use the repo's default branch if it isn't main). Or use the files you were given.
2. **Run the automatic check:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-ui.js" <files…>`. If `CLAUDE_PLUGIN_ROOT` isn't set, use the "Plugin files" path from the session rules. It checks whole files against `zehn.project.json` (or the zehn fallback) and prints each issue with `file:line` and a count per rule.
   - **Review:** fix every issue on lines this branch changed (`git diff -U0 <base>`). For older lines in the same file, don't touch them; report "N legacy issues in <file>" under Needs a decision.
   - **Migration** (the user asked to migrate a page, or the branch already rewrites most of the file): fix every issue in the file in one pass, and rebuild hand-made parts with the mapped components, then the zehn fallback components. Keep the layout unless it breaks a hard rule; a new layout is compose-screen work. Don't migrate other screens in the same change.
3. **Review by eye.** Load the `compose-screen` skill (full rules, catalog and tokens) and check what the script can't see:
   - Invented components, variants or styles: a hand-made button, badge or modal; a new `PrimaryButton`-style wrapper; a zehn component used where the map names the app's own. Use the components mapped in `zehn.project.json` first (their names, imports and props), then the zehn fallback components (`fallback.zehnDir`), then build from the catalog spec with the app's primitives.
   - Layout is a default, not a rule: report a layout that differs from its sibling screens (shell, header, cards vs list, width, container) as a question under **Needs a decision**, never as a violation, and only when no reason is given. Don't "fix" a layout to match the zehn recipes.
   - Accent anywhere outside the rules §0 list, including `Counter`/`Badge` accents and "recommended option" cards, even if Figma shows it. Primary button not black.
   - Badge `status` that doesn't match the meaning (rules §4).
   - Missing states: empty, loading, error, destructive confirm, permission reason (`disabledReason`).
   - Scope: features nobody asked for (extra actions, filters, stats, statuses on neighbouring screens), changed data meaning (a "withdraw" that deletes), edits to shared components for one screen. Report them under Needs a decision.
   - Drift from sibling screens with no stated reason: a pattern (HeaderPattern, stat cards) on the new page that its neighbours lack, or the reverse (Needs a decision).
   - Motion: load the `motion` skill and run its review checklist (frequency, transform/opacity only, easing, duration, interruptible, origin, reduced motion).
   - Copy: Title Case, dates or money not built with the `format*` helpers and the locale, hard-coded English in a ru/uz app, typos, placeholder or joke data.
   - Dark mode breakage.
   - Accessibility (rules §5a): focus trap and return, keyboard menus, `aria-label` on icon buttons, labelled inputs, reduced-motion paths, Tooltips on non-focusable children, `<div onClick>`, `aria-current="page"` (not `"true"`) on the current nav item, links that reload the page instead of using the router.
   - Craft (rules §1a, §8): `tabular-nums` in number columns, `...` instead of `…`, `opacity-50` disabling, "Submit" / "Invalid input" copy.
   - `zehn-ignore` without "requested by <who>, <why>" (a vague "developer" doesn't count), or one ignored constant reused in many places.
   If another UI review or accessibility skill is installed, you may run it as a second pass; where it disagrees with zehn on visuals (tap size, quotes, colors), zehn wins.
4. **Fix what you can.** Report the rest with `file:line` under **Fixed**, **Needs a decision** and **Design gaps**. Present fixes as a table: `| Before | After | Why |`.
