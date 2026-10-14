---
name: ui-review
description: Review UI code (current changes, a branch, or given files) against the zehn design system and fix violations. Use before opening a PR with UI changes, or when asked to check whether something is on-style.
---

# zehn UI review

1. Find the changed UI files: `git diff --name-only` against the base branch (or use the files you were given).
2. Run the automatic check:
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-ui.js" <files…>`
   If `CLAUDE_PLUGIN_ROOT` isn't set, the script is in this plugin's `scripts/` folder. It prints every issue with `file:line` and a count per rule; for a big legacy file, rewrite it in one pass instead of patching issue by issue.
3. Then load the `compose-screen` skill (it holds the full rules, component catalog and tokens) and review by eye against it. The automatic check can't see these:
   - Rebuilt primitives (a hand-made button, badge or modal instead of the shared component).
   - Wrong screen type or container (a long form in a modal instead of a drawer; content width).
   - Accent color used outside the logo, header bar/icon and first stat card. Primary button not black.
   - Status badge colors that don't match their meaning.
   - Missing states: empty, loading, error, destructive confirm, permission reason.
   - Copy: Title Case, wrong date/money format, typos, placeholder or joke data.
   - Dark mode breakage (colors that don't come from tokens).
   - Accessibility baseline (rules §5a): focus trap + focus return in dialogs, keyboard menus, `aria-label` on icon buttons, labelled inputs, `motion-safe:` animations, loading keeps the button color.
   - `zehn-ignore` lines without "requested by <who>, <why>", or one ignored constant reused in many places.
   - Hand-made components that duplicate one in `src/components/zehn/` (or the plugin's `components/react/`).
   If another UI review or accessibility skill is installed, you may run it as a second pass, but where it disagrees with zehn on visuals (tap size, quotes, colors), zehn wins.
4. Fix what you can. Report the rest as a short list with `file:line`, split into **Fixed**, **Needs a decision** and **Design gaps**.
