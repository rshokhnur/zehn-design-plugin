# zehn-design: Claude Code plugin

Keeps the dev team's AI coding agents on the zehn design system. The Figma file `zehnmind` is the source of truth.

## What it does
| Part | What happens |
|---|---|
| **SessionStart hook** | Every Claude Code session starts knowing the zehn hard rules and loads the `compose-screen` skill for UI work. |
| **`compose-screen` skill** | Builds screens from a Figma link (via the Figma MCP) or composes them from existing patterns when there's no design. Includes the full UI/UX rules, component catalog and token cheat sheet. Ends with a "Design gaps" list for the designer. |
| **`ui-review` skill** | Checks a branch or set of files against the rules and fixes what it can. |
| **`setup-tokens` skill** | Installs `tokens.css`, the Tailwind preset and `tokens.json` into an app. |
| **Style check hook** | After every Edit/Write, it checks the code the agent just wrote for hex/rgb colors, the default Tailwind palette, arbitrary `[..]` values, off-scale spacing/radius/font sizes, extra font weights and non-Inter fonts, and makes the agent fix them. |

## Publish (designer, once)
1. Create a GitHub repo, e.g. `zehn-design-plugin` (private is fine if the devs have access).
2. Upload the contents of this folder to the repo root, so `.claude-plugin/` is at the top level.

## Install (each developer, once)
In Claude Code:
```
/plugin marketplace add rshokhnur/zehn-design-plugin
/plugin install zehn-design@zehn
```
Then, in each app repo, run once: "use the setup-tokens skill".
For the live Figma part, connect the Figma MCP in Claude Code (works with a Dev Mode seat).

## Update after Figma changes
1. Ask Claude (in the designer's project) to re-export the tokens and rules from Figma.
2. Bump `version` in `.claude-plugin/plugin.json` and push.
3. Devs run `/plugin marketplace update zehn`, then re-run `setup-tokens` in their apps.

## Files
- `reference/ui-ux-rules.md`, `reference/components.md`, `reference/tokens.md`: human-readable sources. Edit these, then run `scripts/build-skill.sh`, which inlines them into the skill.
- `tokens/`: generated from Figma variables. Don't hand-edit.
- `scripts/check-ui.js`: the style checker (also works as a CLI: `node scripts/check-ui.js src/**/*.tsx`).
- Escape hatch: a line containing `zehn-ignore: <reason>` is skipped by the checker and must be listed as a design gap.
