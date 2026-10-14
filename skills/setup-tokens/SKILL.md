---
name: setup-tokens
description: Install or update the zehn design tokens (CSS variables, Tailwind preset, JSON) in the current codebase. Use when a zehn app has no --zm-* tokens yet, or after the designer ships a new plugin version.
---

# Install / update zehn tokens

Token files live in this plugin's `tokens/` folder (`${CLAUDE_PLUGIN_ROOT}/tokens/`):
- `tokens.css`: all `--zm-*` variables, light + dark, plus `[data-app]` accents
- `tailwind.preset.js`: Tailwind theme that **replaces** the default palette and scale
- `tokens.json`: for non-web stacks (Flutter, Swift, Kotlin)

Steps:
1. Find the frontend app(s) and how they style: Tailwind (v3 or v4), CSS modules, styled-components, or native.
2. Copy the token files into the app at `src/styles/zehn/` (or the existing styles folder). **Overwrite** any older copies; never edit them by hand.
3. Wire them up:
   - Global CSS: `@import "./zehn/tokens.css";` and load the Inter font (400, 600).
   - Tailwind v3: in `tailwind.config`, set `presets: [require('./src/styles/zehn/tailwind.preset.js')]` and remove the custom colors/spacing that duplicate it.
   - Tailwind v4: in the main CSS, add `@config "./zehn/tailwind.preset.js";`.
   - CSS-in-JS / native: generate a typed theme object from `tokens.json`.
4. Set `<html data-app="{app}">` per app (procurement, hr, tasks, docs, edge, analytics, geo, intelligence, edu, desk), plus the theme switch `data-theme="dark" | "light"`.
5. Don't mass-rewrite existing screens in the same change. Report how many hardcoded colors are left (`node "${CLAUDE_PLUGIN_ROOT}/scripts/check-ui.js" $(git ls-files 'src/**')`) so the team can plan a cleanup.
