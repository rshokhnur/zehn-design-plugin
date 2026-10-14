#!/usr/bin/env node
// Injects the zehn design-system ground rules into every Claude Code session.
'use strict';
const path = require('path');
const root = process.argv[2] || process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');

const context = `# zehn design system (zehn-design plugin is active)
This product's UI must match the zehn design system. Source of truth: Figma file https://www.figma.com/design/ywFHunM35gYeHJozrBJpZO/zehnmind.

For ANY UI work (a new screen, flow, component, modal, or styling change):
1. FIRST load the \`compose-screen\` skill (zehn-design:compose-screen). It contains the full UI/UX rules, the component catalog and the token cheat sheet, and covers both building from a Figma link and composing from patterns when there is no design.
2. The zehn Tailwind preset replaces Tailwind defaults: spacing keys are pixels (p-16 = 16px), there are no blue-500-style colors, and radius is rounded-4/8/12/16/full. Plugin files (tokens, scripts) are in ${root}.
3. Hard rules:
   - Colors, spacing, radius, type and shadows come ONLY from zehn tokens (--zm-* vars or the zehn Tailwind preset). No hex, rgb, default Tailwind palette or arbitrary [..] values.
   - Use existing components (Button, Badge, Input & Select, Avatar, Menu, Toast, Alert Dialog, Empty State…). Never rebuild a primitive. Never make one-off variants.
   - Inter only, weights 400/600. Remix icons (-line).
   - Primary buttons are always black (--zm-primary-bg). The app accent (--zm-app-accent) is only for the logo app name, page-header bar and icon, and the first stat card.
   - Sentence case. Dates 30.06.2026, date-time 30.06.2026 14:27. Money 24,000,000 UZS.
   - Every destructive action gets an Alert Dialog confirm.
   - Light + dark must both work.
4. If there's no Figma design for what you're building, say so in your final message and list the "design gaps" (anything you had to decide that the rules don't cover), so the designer can review.
A style check runs after every edit and will flag violations. Fix them; don't work around them.`;

process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context } }));
