---
name: setup-tokens
description: Install or update the zehn design tokens and shared components (CSS variables, Tailwind preset, React components, Swift/Dart/Kotlin theme files) in the current codebase. Use when a zehn app has no --zm-* tokens or no zehn components yet, or after the designer ships a new plugin version.
---

# Install / update zehn tokens and components

Plugin files are in `${CLAUDE_PLUGIN_ROOT}` (if unset, this skill's plugin folder):
- `tokens/tokens.css`: all `--zm-*` variables, light + dark, `[data-app]` accents, layout sizes.
- `tokens/tailwind.preset.cjs`: Tailwind preset (CommonJS, so it loads from CJS and ESM configs and from v4 `@config`).
- `tokens/tokens.json`: everything as JSON.
- `tokens/native/`: `ZehnTokens.swift` (SwiftUI), `zehn_tokens.dart` (Flutter), `ZehnTokens.kt` (Compose).
- `components/react/`: shared React components (Button, Badge, Input, Menu, Modal, Drawer, AlertDialog, Toast, Tooltip, PageHeader, DataTable…).

## 1. Look before you touch anything
- Which apps, which stack: Tailwind v3 / v4, CSS Modules, CSS-in-JS, SwiftUI, Flutter, Compose.
- `package.json` `"type"` (ESM or CJS), the Tailwind config file name, and whether `postcss.config.*` exists.
- Whether the app already has its own Button/Badge/etc. and its own colors or spacing in the Tailwind config.

## 2. Copy the files (overwrite older copies, never hand-edit them)
- Web: `tokens.css` and `tailwind.preset.cjs` → `src/styles/zehn/`. Remove an old `tailwind.preset.js` copy from v0.1.
- React apps: `components/react/*` → `src/components/zehn/`. If the app already has a component with the same job, keep theirs only if it matches the catalog props; otherwise replace usages gradually (don't mass-rewrite in this change).
- Native: copy the one matching file from `tokens/native/` into the app's theme folder.

## 3. Wire it up
**Tailwind v3, CommonJS config (`tailwind.config.js` without `"type": "module"`, or `.cjs`):**
```js
module.exports = { presets: [require('./src/styles/zehn/tailwind.preset.cjs')], content: [/* keep */] };
```
**Tailwind v3, ESM config (`"type": "module"`, `tailwind.config.js|mjs|ts`):**
```js
import zehn from './src/styles/zehn/tailwind.preset.cjs';
export default { presets: [zehn], content: [/* keep */] };
```
**Tailwind v4 (main CSS):**
```css
@import "tailwindcss";
@config "./zehn/tailwind.preset.cjs";
@import "./zehn/tokens.css";
```
- Tailwind v3 needs `postcss.config.(js|cjs|mjs)` with `tailwindcss` and `autoprefixer`; create it if it's missing (ESM: `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }`).
- **No Tailwind (CSS Modules, plain CSS, CSS-in-JS):** import only `tokens.css` and use `var(--zm-*)`. Do NOT add the Tailwind preset.
- Global CSS: `@import "./zehn/tokens.css";` once, at the root.
- **Inter:** `npm i @fontsource/inter` and import `@fontsource/inter/400.css` + `@fontsource/inter/600.css` in the entry file (or a Google Fonts `<link>` for Inter 400;600 if the app already loads fonts that way).
- **Icons:** `npm i remixicon` and import `remixicon/fonts/remixicon.css` in the entry file.
- **Theme and app:** on `<html>`, set `data-app="<app>"` (procurement, hr, tasks, docs, edge, analytics, geo, intelligence, edu, desk). Theme: set `data-theme="dark"` or `"light"` from the user's setting; with no attribute the OS setting is used. Toggle by changing the attribute; nothing else is needed.
- **Native:** SwiftUI: add `ZehnTokens.swift`, bundle Inter Regular + SemiBold (Info.plist `UIAppFonts`) and Remix Icon SVGs as template images (SF Symbols only as a stopgap, listed as a design gap). Flutter: add `zehn_tokens.dart`, Inter in `pubspec.yaml`, `ZehnColors.light/dark` in your ThemeExtension. Compose: `ZehnTokens.kt`, Inter as a `FontFamily`.

## 4. Check what it broke
The preset **replaces** colors, radius, font sizes/weights and shadows (spacing keeps Tailwind's keys). Existing classes that now render nothing or are off-scale:
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/check-ui.js" $(git ls-files 'src/**')
```
Report the counts by rule (dead classes like `bg-blue-500`/`shadow-lg`/`rounded-md`, off-scale spacing, hex). Fix the dead classes on screens you touch now; don't mass-rewrite other screens in the same change, but tell the team the number so they can plan it. Note: `gray-*` is zehn's own gray scale (black at alpha, flips in dark mode), so old `bg-gray-800` keeps rendering but may look different.
