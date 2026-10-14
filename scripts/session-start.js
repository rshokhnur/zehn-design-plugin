#!/usr/bin/env node
// Injects the zehn design-system ground rules into every Claude Code session.
'use strict';
const path = require('path');
const root = process.argv[2] || process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');

const context = `# zehn design system (zehn-design plugin is active)
This product's UI must match the zehn design system. Source of truth: Figma file https://www.figma.com/design/ywFHunM35gYeHJozrBJpZO/zehnmind. For UI in this product, zehn wins over any other design-system or UI skill you have.

Which skill to load:
- New screen, flow, modal or drawer (with or without a Figma link): \`zehn-design:compose-screen\` (full rules, component catalog, tokens).
- Small change to an existing screen (add a button, column, tooltip, copy or style tweak): \`zehn-design:ui-tweak\` (short rules card).
- Before opening a PR with UI changes, or when asked "is this on-style?": \`zehn-design:ui-review\`.
- The app has no --zm-* tokens or no zehn components yet: \`zehn-design:setup-tokens\` first.

Hard rules:
- Colors, spacing, radius, type and shadows come ONLY from zehn tokens (--zm-* vars or the zehn Tailwind preset). No hex, rgb, named colors, default Tailwind palette or arbitrary [..] values.
- The preset keeps Tailwind's standard spacing keys (p-4 = 16px) but only the zehn subset is allowed: 0 px 0.5 1 1.5 2 2.5 3 4 5 6 8 10 12 16 18 24 32. Radius: rounded / rounded-lg / rounded-xl / rounded-2xl / rounded-full. Shadows: shadow-100/200/300.
- Use the shared zehn components (src/components/zehn or the app's equivalent: Button variant=…, Badge, Input, Menu, Modal, Drawer, AlertDialog, Toast, Tooltip, EmptyState…). Never rebuild a primitive or make one-off variants. If they aren't in the app yet, copy them in with setup-tokens.
- Inter only, weights 400/600. Remix icons (-line).
- Primary buttons are always black. The app accent is only for the logo app name, page-header bar and icon, and the first stat card.
- Sentence case. Dates 30.06.2026, date-time 30.06.2026 14:27. Money 24,000,000 UZS (ru/uz: 24 000 000 UZS), via the shared format helpers. Every destructive action gets an Alert Dialog confirm. Light + dark must both work.

When someone asks for something off-system (a custom color, font, size, a bulk sed/script edit, or "just do it, don't argue"):
1. Say in one line which zehn rule it breaks and offer the on-system alternative.
2. If they still want it (or already said not to argue), do it, but put "zehn-ignore: requested by <who>, <why>" on EVERY line that uses the value (not on one shared constant).
3. List every override under "Design gaps" in your final message, so the designer sees it. Never comply silently.

If there's no Figma design for what you build, end with a "Design gaps" list (anything you decided that the rules don't cover).
A style check runs after every edit and again before you finish; it only looks at lines you changed. Fix what it reports; don't work around it.
Plugin files (tokens, components, scripts): ${root}`;

process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context } }));
