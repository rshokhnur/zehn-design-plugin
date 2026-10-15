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
| **Style check** | Runs only in zehn repos (a `zehn.project.json`, zehn enabled in `.claude/settings.json`, or `--zm-*` tokens). Checks only the lines the agent changed: Edit/Write right after each edit, Bash and script edits once before the agent finishes. With `zehn.project.json` it enforces your tokens (declared CSS variables, your Tailwind colors and spacing keys), flags raw `<button>`/`<select>` outside your components folder, and flags new look-alike components (`PrimaryButton`, `StatusPill`) that duplicate a mapped one. Hex, rgb, named colors, arbitrary `[..]` values, off-scale radius, type and sizes, gradients, pill buttons and off-system motion (`transition-all`, over 300ms, layout animation, bounce, no reduced-motion path) are flagged everywhere outside your token files. Any edit inside your shared components folder is flagged for designer sign-off. Without the file it applies the zehn fallback rules. |

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

## Update
Devs: `/plugin marketplace update zehn`, then run setup-project again (it keeps your `zehn.project.json` and only adds or fixes entries).
Designer, after Figma changes: re-export the variables to `tokens/source/figma_vars.json`, run `python3 scripts/gen-tokens.py`, edit `reference/*.md` if rules changed and run `scripts/build-skill.sh`, run `node tests/check-ui.test.js` and `bash tests/build-skill.test.sh`, bump `version` in `.claude-plugin/plugin.json`, push.

## Upgrading to 1.3
`/plugin marketplace update zehn`, then "set up zehn for this project" once more: it adds `app` (asking for the accent if your module has none) and an empty `decisions` to `zehn.project.json`.

## Upgrading to 1.2
`/plugin marketplace update zehn`. Apps that copied zehn's components: run setup-project again to pick up the TopBar fix and the new `Orb`, `AppSwitcher`, `ObjectCard` and `setTheme`.

## Upgrading to 1.1
Nothing to run: `/plugin marketplace update zehn`. Layout rules are now defaults (see CHANGELOG.md), and shared-folder edits show a note instead of an error.

## Upgrading to 1.0 (from 0.4)
Run "set up zehn for this project" again: it adds `motion`, `i18n` and (if your theme differs from zehn's) `radiusKeys`, `fontSizeKeys`, `fontWeights` to `zehn.project.json`. Then read the style check's first report: it now checks radius, font size and weight in your project too. Full list in `CHANGELOG.md`.

## Upgrading from 0.3
- **Reframe:** zehn now guards your existing system instead of replacing it. Run "set up zehn for this project" to write `zehn.project.json`; the style check enforces it. `setup-tokens` is now `setup-project`; it installs zehn tokens and components only where you have none.
- **Install per project:** re-install with `--scope project` (above) and commit `.claude/settings.json`; remove a user-wide install if you had one.
- New props on the zehn fallback components: `Button`/`IconButton` `disabledReason` (focusable disabled button with a Tooltip), `RoleBanner tone="warning"` (view-only access). Removed: `Counter color="accent"` (use `neutral`); the accent never marks counts.
- Rules: one "Who wins" order (user request via the off-system steps > hard rules > Figma and your mapped components > catalog > judgement; when unsure, follow Figma), a radius table per element, the complete accent list, a modal vs drawer order, content-width and page-header action rules, locale rules (pass the locale to formatters; Uzbek `‘` U+2018).
- The catalog now matches the zehn code: real React props, and the 6 Figma-only components are marked with an allowed move.
- Skill routing: compose-screen for new screens and layout changes, ui-tweak for edits that keep the layout, ui-review for PR review and migrations.
- Spacing keys `64 80 128` (256/320/512px) are allowed for section spacing, as the check always did.

## Upgrading from 0.2
- Web cards, panels, tables, toasts and badges use 4px corners (`rounded`), as in Figma. Badge tinted fills, Switch (cyan when on) and Toast (white card) now match the Figma components.
- New components: `HeaderPattern`, `RoleBanner`, `ZehnLocaleProvider` (en / ru / uz labels) and `format*` helpers (dates, money, numbers, durations). Re-run setup to copy them in.
- New layout tokens: `h-chart-card` (334), `h-chart-plot` (208), `w-toast` (432).
- The style check also flags raw `<button>`/`<select>`/`confirm()` in app code, `!important` overrides, and named colors inside shorthands.

## Upgrading from 0.1
- Tailwind spacing now uses the **standard Tailwind keys** (`p-4` = 16px). Code written with 0.1's pixel keys (`p-16`, `gap-12`) must be converted (`p-4`, `gap-3`). The style check flags the off-scale ones (`p-20`, `gap-40`), but `p-16`, `gap-12`, `p-24` etc. stay valid and silently grow 4×, so search for them.
- Radius classes are now `rounded` (4), `rounded-lg` (8), `rounded-xl` (12), `rounded-2xl` (16), `rounded-full`; `rounded-4/8/12/16` are flagged.
- The preset file is now `tailwind.preset.cjs`; delete the old `tailwind.preset.js` copy.
- Button/IconButton use `variant` (not `style`); Badge uses `appearance` + `color`/`status`; Counter uses `tone`.

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
- anbar, abat and new modules: setup asks the developer for an accent and saves it per repo; tell them which one you want. office (Cyan) and meet (Pink) come from Figma; confirm them.
