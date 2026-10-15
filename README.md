# zehn-design: Claude Code plugin

Keeps the dev team's AI coding agents on the design system you already have. Agents drift: they build screens unlike the existing ones, invent components in another style and reach for off-system values. zehn is a guardrails layer over your own tokens, components and screens, checked against the zehnmind Figma file. zehn's own tokens and components are a fallback for repos that have none.

## What it does
| Part | What happens |
|---|---|
| **`zehn.project.json`** | Written once per app by `setup-project`: your token files and color keys, your component for each catalog entry (import, props, differences from Figma), and the best example screen per screen type. Everything below reads it. |
| **SessionStart hook** | Every session in the repo gets the guardrails, which skill to use when, and the off-system protocol. |
| **`compose-screen` skill** | New screens, pages, flows, modals, drawers, or a layout change: from a Figma link or composed from your example screens. Full UI/UX rules and component catalog. Ends with a "Design gaps" list for the designer. |
| **`ui-tweak` skill** | Edits that keep a screen's layout, with a short rules card. |
| **`ui-review` skill** | Reviews a branch or files before a PR, or migrates an old page. |
| **`motion` skill** | Animation: what may move, durations and easings as tokens, recipes for modals, drawers, menus, tooltips, toasts, press feedback and list changes, reduced motion. Uses the app's own motion stack. |
| **`setup-project` skill** | Maps your system into `zehn.project.json`, reports the gaps, and installs zehn tokens or components only where you have none. |
| **Style check** | Runs only in zehn repos (a `zehn.project.json`, zehn enabled in `.claude/settings.json`, or `--zm-*` tokens). Checks only the lines the agent changed: Edit/Write right after each edit, Bash and script edits once before the agent finishes. With `zehn.project.json` it enforces your tokens (declared CSS variables, your Tailwind colors and spacing keys), flags raw `<button>`/`<select>` outside your components folder, and flags new look-alike components (`PrimaryButton`, `StatusPill`) that duplicate a mapped one. Hex, rgb, named colors, arbitrary `[..]` values, off-scale radius, type and sizes, gradients, pill buttons and off-system motion (`transition-all`, over 300ms, layout animation, bounce, no reduced-motion path) are flagged everywhere outside your token files. An edit inside your shared components folder or theme gets a one-time note for designer sign-off (not for files setup-project copied). Without the file it applies the zehn fallback rules. |

## Install (once per app repo)
One developer runs this in the app repo and commits `.claude/settings.json`:
```
claude plugin marketplace add rshokhnur/zehn-design-plugin --scope project
claude plugin install zehn-design@zehn --scope project
```
(In a session: `/plugin marketplace add rshokhnur/zehn-design-plugin --scope project`, then pick "project" when `/plugin install` asks for the scope.) Everyone who opens the repo is prompted to enable it; it stays off in other projects.
Then, in a session: "set up zehn for this project". It writes `zehn.project.json`; review it and commit it.
For the live Figma part, connect the Figma MCP in Claude Code (works with a Dev Mode seat).
- From a zip: unzip to a permanent folder and run `claude plugin marketplace add ~/zehn-design-plugin --scope local`, then install with `--scope local`.
- A user-wide install (`--scope user`) also works: outside zehn repos it adds one line at session start and the style check stays silent. Per project is still the recommended way, so the whole team gets the same version.

### Option C: a copy inside the app repo (devs need no access to this GitHub repo)
The plugin folder is committed in the app repo, and the app's `.claude/settings.json` points at it with a repo-relative path. Anyone who clones the app gets zehn after they trust the folder at the first `claude` start; there's nothing to install.

1. Get `zehn-design-plugin.zip` (from the designer) and unzip it anywhere.
2. In the app repo: `bash <unzipped>/zehn-design-plugin/scripts/vendor.sh <unzipped>/zehn-design-plugin`
   It copies the plugin to `.claude/plugins/zehn-design/` and adds this to `.claude/settings.json` (other keys are kept):
   ```json
   {
     "extraKnownMarketplaces": { "zehn": { "source": { "source": "directory", "path": "./.claude/plugins/zehn-design" } } },
     "enabledPlugins": { "zehn-design@zehn": true }
   }
   ```
3. Commit both: `git add .claude/plugins/zehn-design .claude/settings.json`.
4. In a session: "set up zehn for this project", then commit `zehn.project.json`.

**Update:** this copy loads in place. Replace the folder (Update, below, "copy inside the app repo"). Open sessions need `/reload-plugins`.
- Don't hand-edit the copy; changes go to the designer and come back in the next zip.
- If your linters or TypeScript scan the whole repo, exclude `.claude/plugins/` (the copy has `.tsx` fallback components).
- Someone who added zehn from GitHub before: `claude plugin marketplace remove zehn` once, so the repo's copy is used.

## Update
Claude Code keeps the installed copy until something replaces that copy. `/plugin marketplace update zehn` only refreshes the catalog. It does not replace the plugin, and a third-party marketplace does not auto-update.

Where is zehn installed? Read `extraKnownMarketplaces.zehn.source`.
- **Copy inside the app repo** (`directory`, path `./.claude/plugins/zehn-design`): `bash .claude/plugins/zehn-design/scripts/vendor.sh <new zip or folder>`, then commit. The folder is the plugin, so there is no marketplace update. Open sessions: `/reload-plugins`.
- **A local folder** (`directory`, any other path): replace that folder, then `/reload-plugins`. It loads in place, so `plugin update` has no cached copy to replace.
- **GitHub**: `claude plugin update zehn-design@zehn`, then `/reload-plugins` in the open session. A new session loads the new version on its own.

Then say "update zehn". setup-project adds new keys to `zehn.project.json` and re-checks component fixes in `CHANGELOG.md` newer than `pluginVersion`. What changed in each version: `CHANGELOG.md`.
Designer, after Figma changes: re-export the variables to `tokens/source/figma_vars.json`, run `python3 scripts/gen-tokens.py`, edit `reference/*.md` if rules changed and run `scripts/build-skill.sh`, run `node tests/check-ui.test.js` and `bash tests/build-skill.test.sh`, bump `version` in `.claude-plugin/plugin.json`, push.

## Files
- `reference/*.md`: human-readable rules, catalog and token sheet. Edit these, then run `scripts/build-skill.sh` (it inlines them into compose-screen).
- `tokens/`: the fallback tokens, generated by `scripts/gen-tokens.py` from `tokens/source/figma_vars.json`. Don't hand-edit.
- `components/react/`: zehn React + Tailwind components, the fallback that `setup-project` copies into apps that lack a component.
- `CHANGELOG.md`: what changed in each version.
- `scripts/check-ui.js`: the style checker (also a CLI: `node scripts/check-ui.js src/**/*.tsx`). `tests/check-ui.test.js`: its regression cases.
- `tests/build-skill.test.sh`: fails if `skills/compose-screen/SKILL.md` is out of date with its sources.
- Escape hatch: `zehn-ignore: requested by <who>, <why>` on a line skips it (only when a user asked); every one must be listed as a design gap.

## Designer to-do
- Figma variables: add `Edu Green/default #21aa31`, `/darker #038c17`, `/deep #005c3d` (+ stroke/fill-1/fill-2, light and dark). The plugin already ships them as `--zm-edu-green*`; edu screens use raw hex today.
- geo: bind the raw `#7eaf30` to `Yellow-Green/default`.
- Semantic variables the plugin already ships as aliases: `text/primary`, `text/secondary`, `text/tertiary`, `border/default`, `bg/base`, `bg/subtle`, `status/*`, `app/accent`.
- Confirm the edge accent (Orange in the plugin; the edge logo in Figma says "tasks").
- Confirm the small (24px) button radius: the code ships 4 (`rounded`), the other sizes 8.
- Confirm menus use `Drop Shadow/300` (the code ships `shadow-300`).
- Build or approve specs for the Figma-only components: Multi-select, OTP Input, Breadcrumbs, MobileTabBar.
- Confirm `RoleBanner tone="info"` stays cyan (it equals the accent in cyan apps; Badge info is blue), and `text-lg` for mobile card titles only.
- anbar, abat and new modules: setup asks the developer for an accent and saves it per repo; tell them which one you want. office (Cyan) and meet (Pink) come from Figma; confirm them.
