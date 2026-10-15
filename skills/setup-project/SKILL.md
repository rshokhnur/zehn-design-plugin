---
name: setup-project
description: Set up zehn for this project, once per app repo and after a plugin update. Maps the app's own tokens, components and example screens to the zehn Figma variables and catalog in zehn.project.json, reports the gaps, and installs zehn tokens or components only where the app has none. Use when the repo has no zehn.project.json, the user says "set up zehn", or after a plugin update ("update zehn"). Not for building or reviewing screens.
---

# Set up zehn for this project

zehn is a guardrails layer over the app's **existing** design system. Map what's there; install nothing that already exists. Never overwrite, rename or duplicate the app's tokens or components.

An empty folder: use the stack the user names (else React + Tailwind), install the zehn fallback (steps 4–5), and write `zehn.project.json` with `fallback` set; no discovery.

Plugin files are in `${CLAUDE_PLUGIN_ROOT}` (if unset, use the "Plugin files" path from the session rules): `tokens/` (zehn CSS variables, Tailwind preset, native theme files), `components/react/` (zehn React components), `reference/` (rules, catalog, tokens).

## 0. Enable the plugin for this repo
If `.claude/settings.json` lacks these keys, merge them in (keep every other key; create the file if missing):
```json
{
  "extraKnownMarketplaces": { "zehn": { "source": { "source": "github", "repo": "rshokhnur/zehn-design-plugin" } } },
  "enabledPlugins": { "zehn-design@zehn": true }
}
```
If the repo has its own copy at `.claude/plugins/zehn-design/` (README, Option C), keep the `zehn` entry as `{ "source": "directory", "path": "./.claude/plugins/zehn-design" }` and never replace it with the GitHub one.
Tell the user to commit it: everyone who opens the repo is then prompted to enable zehn, and it stays off in other projects.

## 1. Discover
- **Framework and styling:** React, Vue, Svelte, Angular, native; Tailwind (v3 config or v4 `@theme`), CSS Modules, CSS-in-JS.
- **Tokens:** the theme files (`globals.css`, `theme.css`, `tailwind.config.*`, a tokens JSON), their CSS variable prefixes, their Tailwind color keys, and their spacing scale if it's restricted.
- **Components:** the library (`package.json`: shadcn's `components.json`, `@radix-ui/*`, `@mui/*`, `antd`, `@headlessui/*`…; folders: `src/components/ui`, `components/`, `packages/ui`, an `index` barrel). Read each component's props.
- **Screens:** the best existing example of each screen type (table list, card feed, detail, form modal, drawer, dashboard, settings, empty).
- **Motion:** the animation stack (`framer-motion`/`motion`, `react-spring`, CSS/Tailwind only), any duration or easing tokens, and whether reduced motion is handled once at the root (`<MotionConfig reducedMotion="user">`, a global `prefers-reduced-motion` rule).
- **i18n:** the i18n library and its locales (`react-i18next`, `next-intl`, `lingui`…), or none.
- **Old zehn copies:** `src/styles/zehn/`, `src/components/zehn/`, a `tailwind.preset.js`/`.cjs` with `--zm-`, or an older `zehn.project.json`. See step 4b.

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
  "pluginVersion": "1.5.1",
  "app": { "id": "office", "accent": "cyan", "modules": { "anbar": "violet" } },
  "decisions": {},
  "screens": { "table list": "src/app/requests/page.tsx", "detail": "src/app/requests/[id]/page.tsx" },
  "motion": { "library": "framer-motion", "durations": [150, 200, 300], "easings": { "out": "--ease-out" }, "reducedMotion": "global" },
  "i18n": { "library": "react-i18next", "locales": ["en", "ru", "uz"] },
  "fallback": { "zehnTokens": false, "zehnDir": null, "copied": [], "notCopied": { "Drawer": "app has Sheet (mapped)" } }
}
```
- `tokens.sources`: every file that declares their tokens. The style check allows exactly the CSS variables declared there and skips these files. Variables named `--color-*` count as Tailwind colors (v4 `@theme`).
- `tokens.cssVarPrefixes`: only for variables you can't list in a source file (e.g. `--radix-` set at runtime). A prefix lets every variable that starts with it through, so never list the app's own token prefix.
- `tokens.radiusKeys`, `tokens.fontSizeKeys`, `tokens.fontWeights`: the Tailwind keys their theme defines for these, when it differs from zehn's (e.g. shadcn's `rounded-md`, `font-medium`). Leave them out to use zehn's scale.
- `tokens.tailwindColors`: every color key their Tailwind theme defines (flatten nested keys: `primary.foreground` → `primary-foreground`). The check reads JSON sources itself but not JS/TS configs, so list them here.
- `tokens.spacingKeys`: only if they restrict spacing; otherwise leave it out (the zehn subset applies).
- `tokens.figmaMap`: each Figma variable the designs use → their token.
- `components.map`: each catalog component (`${CLAUDE_PLUGIN_ROOT}/reference/components.md`) → their component, its import, how the catalog props map to theirs, and `gaps` (every style difference from the Figma component). Add `"sizedByCaller": true` to their placeholder or layout components (their Skeleton, EmptyState, Card under any name), so height, padding and radius on them aren't flagged as a restyle (catalog, "`className` on a component"). Leave a catalog component out when they have none.
- `screens`: screen type → the best existing example file. Agents copy its layout.
- `pluginVersion`: the plugin's version (`.claude-plugin/plugin.json`) at this setup.
- `app`: which zehn app this repo is (`id`, as in `data-app`) and its accent (rules §0). Modules the repo also renders under their own `data-app` go in `app.modules` (`"<id>": "<hue>"`). For a module with no accent in the rules (anbar, abat, a new one), ask the developer which accent to use (AskUserQuestion: Violet recommended, then Coral, Teal; Cyan if it belongs to procurement or office) and save it. With zehn tokens, also add `[data-app="<id>"] { --zm-app-accent: var(--zm-<hue>); --zm-app-accent-stroke: var(--zm-<hue>-stroke); --zm-app-accent-fill: var(--zm-<hue>-fill-2); }` to the app's global CSS; with their own tokens, map the accent token.
- `decisions`: answers to forks agents asked the developer (rules, "Ask the developer"). Start empty; agents add to it.
- `fallback.copied`: the zehn files you copied or adapted into the app (paths). The style check doesn't ask for designer sign-off on these. `fallback.notCopied`: catalog components you didn't copy → a one-line reason. Whenever you copy or map one, delete its `notCopied` entry in the same edit.
- Several equally good mappings (two Button components, two theme files)? Ask the developer which is the real one instead of guessing.
- `motion`: `library` (`css`, `tailwind`, `framer-motion`, `motion`, `react-spring`); `durations` (allowed ms; leave out to use zehn's 150/200/300); `easings` (role → their token); `reducedMotion`: `"global"` if handled once at the root, else `"per-component"`. If they have no motion tokens and use Tailwind with zehn tokens, the zehn ones apply. Don't add a motion library.
- `i18n`: their library and locales, or `null`. With `null`, agents write English and list it as a gap, and zehn formatters default to `en`.
- On an update, keep the file and only add or fix entries.

## 3. Report the gaps
List these as Design gaps in your message: Figma variables with no token, catalog components with no counterpart, and their components that look different from Figma. Don't change their tokens or components to fix them unless the user asks.
- **Primary isn't black** (e.g. shadcn's blue `--primary`): don't change it. Report it first in the gaps as a designer decision ("zehn primary is black; yours is blue: change the theme token?"), and map `primary` to their token meanwhile.
- **No i18n:** report it once; agents won't flag every English string again.

## 4. Fallback: install zehn only where nothing exists
- **No tokens at all:** install the zehn tokens (step 5) and set `"fallback": { "zehnTokens": true }`.
- **Partial tokens** (e.g. colors but no spacing scale): ask the user before adding anything; add only the missing pieces.
- **React + Tailwind, no component for a catalog entry:** copy just that zehn component from `components/react/` into `src/components/zehn/` (plus the files it imports: `cx.ts`, `Icon.tsx`, `hooks.ts`, `locale.tsx`, `format.ts`), trim `index.ts` to what you copied, and set `"fallback.zehnDir": "src/components/zehn"`. Copy `format.ts` for `formatDate`/`formatMoney` if the app has no formatters.
- **Not React, or React without Tailwind** (CSS Modules, styled-components, MUI, shadcn with its own theme): never copy the zehn components; they're Tailwind and need the zehn preset. For a missing catalog component, the agent builds it later from the catalog spec with their primitives, in their styling.
- **Adapt what you copy to the repo** (in the copies, never in the plugin):
  - Motion: if the app has its own duration and easing tokens, replace `duration-fast|base|slow` and `ease-out|in-out|in` with theirs (`motion.durations`, `motion.easings`). If it has none, add just the `--zm-duration-*`, `--zm-ease-*` and `--zm-press-scale` lines (with the reduced-motion block) from `tokens/tokens.css` to their global CSS and the matching `transitionDuration`/`transitionTimingFunction`/`scale` keys to their Tailwind theme.
  - Labels: with an app i18n, pass its strings through `<ZehnLocaleProvider labels={…}>` (keys in `locale.tsx`) instead of zehn's built-in en/ru/uz.
  - Colors and radius classes the copy uses must exist in their theme; map them through `tokens.figmaMap` and list any that don't under the gaps.
  - Add every copied file to `fallback.copied`.
- zehn's React components need `<ZehnLocaleProvider locale={…}>` (locale from the app's i18n, never a literal) and, if they use toasts, `<ToastProvider>` inside it.

## 4b. An older or partial zehn install
- A zehn preset that replaces Tailwind's colors, radius and type silently breaks the app's own classes (`bg-indigo-600`, `rounded-md`, `font-bold` render nothing). If the app also has its own theme, remove the preset from the Tailwind config (keep `tokens.css` only if something uses `--zm-*`) and tell the user what changed.
- Old zehn component copies the app doesn't import: list them and ask before deleting. Ones it imports: update them from `components/react/` (they're zehn's files; never hand-edited).
- An old `zehn.project.json`: keep it, add the new keys (`motion`, `i18n`, the key lists).

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

## 5a. Known fixes to re-check
On an update, read the plugin's `CHANGELOG.md` entries newer than `pluginVersion` (all of them if it's missing) for component fixes (e.g. 1.2.0: the TopBar active tab lost its fill because a ghost button's transparent background won over the active one), then set `pluginVersion` to the plugin's version. Check the app's mapped components for the same bug and report each one as a gap for designer sign-off; don't edit them unless the user asks.

## 6. Finish
Check that the hooks run in this repo: `echo '{}' | node "${CLAUDE_PLUGIN_ROOT}/scripts/session-start.js"` must print JSON. If it prints an error (e.g. `require is not defined in ES module scope`), the plugin's startup rules and style check are silently off: say so first in your message, in bold, with the error. The usual cause is a plugin copy missing its `package.json` (`"type": "commonjs"`); re-copy the plugin.
Run the style check on one existing screen to confirm the map: `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-ui.js" <screen>`. Its issues should be real drift, not missing map entries; fix the map until they are. Tell the user to commit `zehn.project.json` (and `.claude/settings.json` if you changed it).
