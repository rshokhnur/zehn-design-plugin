---
name: setup-project
description: Set up zehn for this project, once per app repo and after a plugin update. Maps the app's own tokens, components and example screens to the zehn Figma variables and catalog in zehn.project.json, reports the gaps, and installs zehn tokens or components only where the app has none. Use when the repo has no zehn.project.json, or the user says "set up zehn". Not for building or reviewing screens.
---

# Set up zehn for this project

zehn is a guardrails layer over the app's **existing** design system. Map what's there; install nothing that already exists. Never overwrite, rename or duplicate the app's tokens or components.

An empty folder isn't the target. If someone starts one, use the team's usual stack if they name it, install the zehn fallback (step 4–5), and keep going; don't spend long on it.

Plugin files are in `${CLAUDE_PLUGIN_ROOT}` (if unset, use the "Plugin files" path from the session rules): `tokens/` (zehn CSS variables, Tailwind preset, native theme files), `components/react/` (zehn React components), `reference/` (rules, catalog, tokens).

## 0. Enable the plugin for this repo
If `.claude/settings.json` lacks these keys, merge them in (keep every other key; create the file if missing):
```json
{
  "extraKnownMarketplaces": { "zehn": { "source": { "source": "github", "repo": "rshokhnur/zehn-design-plugin" } } },
  "enabledPlugins": { "zehn-design@zehn": true }
}
```
Tell the user to commit it: everyone who opens the repo is then prompted to enable zehn, and it stays off in other projects.

## 1. Discover
- **Framework and styling:** React, Vue, Svelte, Angular, native; Tailwind (v3 config or v4 `@theme`), CSS Modules, CSS-in-JS.
- **Tokens:** the theme files (`globals.css`, `theme.css`, `tailwind.config.*`, a tokens JSON), their CSS variable prefixes, their Tailwind color keys, and their spacing scale if it's restricted.
- **Components:** the library (`package.json`: shadcn's `components.json`, `@radix-ui/*`, `@mui/*`, `antd`, `@headlessui/*`…; folders: `src/components/ui`, `components/`, `packages/ui`, an `index` barrel). Read each component's props.
- **Screens:** the best existing example of each screen type (table list, card feed, detail, form modal, drawer, dashboard, settings, empty).
- **Motion:** the animation stack (`framer-motion`/`motion`, `react-spring`, CSS/Tailwind only), any duration or easing tokens, and whether reduced motion is handled once at the root (`<MotionConfig reducedMotion="user">`, a global `prefers-reduced-motion` rule).
- **i18n:** the i18n library and its locales (`react-i18next`, `next-intl`, `lingui`…), or none.
- **Old zehn copies:** `src/styles/zehn/`, `src/components/zehn/`, a `tailwind.preset.js`/`.cjs` with `--zm-`, or an older `zehn.project.json`. See step 4a.

## 2. Map and write `zehn.project.json` at the app root
```json
{
  "framework": "react",
  "styling": "tailwind",
  "tokens": {
    "sources": ["src/styles/globals.css", "tailwind.config.ts"],
    "cssVarPrefixes": ["--radix-"],
    "tailwindColors": ["background", "foreground", "primary", "primary-foreground", "muted-foreground", "border", "destructive"],
    "spacingKeys": ["0", "1", "2", "3", "4", "6", "8", "12"],
    "figmaMap": { "Grayscale/600": "--muted-foreground / text-muted-foreground", "Action/Background": "--primary / bg-primary" }
  },
  "components": {
    "dir": "src/components/ui",
    "map": {
      "Button": { "component": "Button", "import": "@/components/ui/button",
        "props": { "variant=primary": "variant=\"default\"", "loading": "disabled + <Loader2 /> child" },
        "gaps": ["radius 6, Figma 8"] },
      "Modal": { "component": "Dialog", "import": "@/components/ui/dialog", "props": {}, "gaps": [] }
    }
  },
  "screens": { "table list": "src/app/requests/page.tsx", "detail": "src/app/requests/[id]/page.tsx" },
  "motion": { "library": "framer-motion", "durations": [150, 200, 300], "easings": { "out": "--ease-out" }, "reducedMotion": "global" },
  "i18n": { "library": "react-i18next", "locales": ["en", "ru", "uz"] },
  "fallback": { "zehnTokens": false, "zehnDir": null }
}
```
- `tokens.sources`: every file that declares their tokens. The style check allows exactly the CSS variables declared there and skips these files. Variables named `--color-*` count as Tailwind colors (v4 `@theme`).
- `tokens.cssVarPrefixes`: only for variables you can't list in a source file (e.g. `--radix-` set at runtime). A prefix lets every variable that starts with it through, so never list the app's own token prefix.
- `tokens.radiusKeys`, `tokens.fontSizeKeys`, `tokens.fontWeights`: the Tailwind keys their theme defines for these, when it differs from zehn's (e.g. shadcn's `rounded-md`, `font-medium`). Leave them out to use zehn's scale.
- `tokens.tailwindColors`: every color key their Tailwind theme defines (flatten nested keys: `primary.foreground` → `primary-foreground`). The check reads JSON sources itself but not JS/TS configs, so list them here.
- `tokens.spacingKeys`: only if they restrict spacing; otherwise leave it out (the zehn subset applies).
- `tokens.figmaMap`: each Figma variable the designs use → their token.
- `components.map`: each catalog component (`${CLAUDE_PLUGIN_ROOT}/reference/components.md`) → their component, its import, how the catalog props map to theirs, and `gaps` (every style difference from the Figma component). Leave a catalog component out when they have none.
- `screens`: screen type → the best existing example file. Agents copy its layout.
- `motion`: `library` (`css`, `tailwind`, `framer-motion`, `motion`, `react-spring`); `durations` (allowed ms; leave out to use zehn's 150/200/300); `easings` (role → their token); `reducedMotion`: `"global"` if handled once at the root, else `"per-component"`. If they have no motion tokens and use Tailwind with zehn tokens, the zehn ones apply. Don't add a motion library.
- `i18n`: their library and locales, or `null`. With `null`, agents write English and list it as a gap, and zehn formatters default to `en`.
- On an update, keep the file and only add or fix entries.

## 3. Report the gaps
List these as Design gaps in your message: Figma variables with no token, catalog components with no counterpart, and their components that look different from Figma. Don't change their tokens or components to fix them unless the user asks.
- **Primary isn't black** (e.g. shadcn's blue `--primary`): don't change it. Report it first in the gaps as a designer decision ("zehn primary is black; yours is blue: change the theme token?"), and map `primary` to their token meanwhile.
- **No i18n:** report it once; agents won't flag every English string again.

## 4a. An older or partial zehn install
- A zehn preset that replaces Tailwind's colors, radius and type silently breaks the app's own classes (`bg-indigo-600`, `rounded-md`, `font-bold` render nothing). If the app also has its own theme, remove the preset from the Tailwind config (keep `tokens.css` only if something uses `--zm-*`) and tell the user what changed.
- Old zehn component copies the app doesn't import: list them and ask before deleting. Ones it imports: update them from `components/react/` (they're zehn's files; never hand-edited).
- An old `zehn.project.json`: keep it, add the new keys (`motion`, `i18n`, the key lists).

## 4. Fallback: install zehn only where nothing exists
- **No tokens at all:** install the zehn tokens (step 5) and set `"fallback": { "zehnTokens": true }`.
- **Partial tokens** (e.g. colors but no spacing scale): ask the user before adding anything; add only the missing pieces.
- **React + Tailwind, no component for a catalog entry:** copy just that zehn component from `components/react/` into `src/components/zehn/` (plus the files it imports: `cx.ts`, `Icon.tsx`, `hooks.ts`, `locale.tsx`, `format.ts`), trim `index.ts` to what you copied, and set `"fallback.zehnDir": "src/components/zehn"`. Copy `format.ts` for `formatDate`/`formatMoney` if the app has no formatters.
- **Not React, or React without Tailwind** (CSS Modules, styled-components, MUI, shadcn with its own theme): never copy the zehn components; they're Tailwind and need the zehn preset. For a missing catalog component, the agent builds it later from the catalog spec with their primitives, in their styling.
- zehn's React components need `<ZehnLocaleProvider locale={…}>` (locale from the app's i18n, never a literal) and, if they use toasts, `<ToastProvider>` inside it.

## 5. Install the zehn tokens (fallback only)
Copy `tokens/tokens.css` and `tokens/tailwind.preset.cjs` to `src/styles/zehn/` (overwrite older zehn copies, never hand-edit them; remove an old `tailwind.preset.js`).

**Tailwind v3, CommonJS config:** `module.exports = { presets: [require('./src/styles/zehn/tailwind.preset.cjs')], content: [/* keep */] };`
**Tailwind v3, ESM config:** `import zehn from './src/styles/zehn/tailwind.preset.cjs'; export default { presets: [zehn], content: [/* keep */] };`
**Tailwind v4 (main CSS):** `@import "tailwindcss";` then `@config "./zehn/tailwind.preset.cjs";` then `@import "./zehn/tokens.css";`
- Tailwind v3 needs `postcss.config.*` with `tailwindcss` and `autoprefixer`; create it if missing.
- No Tailwind: import only `tokens.css` and use `var(--zm-*)`.
- Tailwind v3 or no Tailwind: `@import "./zehn/tokens.css";` once in the global CSS (relative to that file).
- Inter 400/600 (`@fontsource/inter`) and Remix icons (`remixicon`), if the app has no font or icon set.
- On `<html>`: `data-app="<app>"`; `data-theme="light"|"dark"` from the user's setting (without it the OS decides).
- Native: copy the matching file from `tokens/native/` (`ZehnTokens.swift`, `zehn_tokens.dart`, `ZehnTokens.kt`) into the theme folder.

The preset replaces Tailwind's colors, radius, type and shadows, so install it only when the app has no theme. Then run `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-ui.js" $(git ls-files 'src/**')` and report the counts by rule.

## 6. Finish
Run the style check on one existing screen to confirm the map: `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-ui.js" <screen>`. Its issues should be real drift, not missing map entries; fix the map until they are. Tell the user to commit `zehn.project.json` (and `.claude/settings.json` if you changed it).
