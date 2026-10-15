# Changelog

## 1.5.0 (15.10.2026)
From the second writing review (PLUGIN-WRITING-REVIEW-2.md, 63 findings).

- **One answer for `className` on components**, at the top of the catalog, matching the style check: layout classes always; height and radius on placeholders; padding and height on layout blocks; never color, border, shadow, font or opacity. Rules §4 and ui-tweak point to it. The check now also exempts the app's renamed placeholder or layout component when its `components.map` key is a catalog placeholder or block (Skeleton → Shimmer), and its message names the `sizedByCaller` opt-in.
- **"Who wins" is two orders:** layout (user request > sibling screens > Figma frame > recipes) and values (user request via §8a > hard rules > Figma component and mapped component > siblings > catalog). "When unsure, follow Figma" now applies to values only, everywhere (rules, ui-tweak, startup text). Layout deviations are a closed list (more than 7 sections, dense data over 20 rows, an embedded widget, or the developer asks).
- **The finish check tells the agent to re-run it** on the listed files until it prints "clean", since it runs once. compose-screen and the startup text now say Bash and script edits are checked only at the finish, so check those files yourself.
- **ui-tweak:** the off-system pointer goes to the right step.
- **Module accents** go in `app.modules` (`"anbar": "violet"`) in `zehn.project.json`; setup offers Violet, Coral or Teal (hues no app uses).
- **Big Figma links:** read only the root's direct children from `get_metadata`, then ask which frames.
- **Icon sizes** in rules §1 match the components (14 small, 16 medium/large and rows, 20 large IconButton).
- **No false sign-off notes on setup's own work:** files listed in `fallback.copied` or identical to the plugin's component skip the design-system and theme notes. `zehn.project.json` gains `pluginVersion` (setup re-checks only newer CHANGELOG fixes), `fallback.copied` and `fallback.notCopied`.
- **Contradictions removed:** ui-review no longer flags a non-black theme primary per button; the layout fork asks only when the recipes allow both; tokens.md points to rules §0 for `data-app` keys; TaskCard is `ObjectCard accentBar` (task cards on a Board only); formatting uses the app's formatters first; the components README matches what setup does.
- **Smaller:** the startup text is 4.5k characters (was 6k); compose-screen repeats less (its size is back under 1.4.1's with the new blocks); routing names "update zehn" and animation/review skills; project-mode color messages show `tokens.figmaMap` examples; catalog props filled in (SegmentedControl `panelId`, Menu `align`, AlertDialog `cancelLabel`, DataTable `getRowLabel`, tones).

## 1.4.1 (15.10.2026)
- **Fix:** the restyle check no longer flags size or spacing on components the screen sizes or lays out. `<Skeleton className="h-4 w-32 rounded-full">`, `<EmptyState className="py-12">` and `<Card className="p-6">` pass. Placeholders (Skeleton, Spinner, Progress, Divider, Icon, Orb, Logo, Image) also take radius; layout components (EmptyState, Card, ObjectCard, Panel, Section, Container, Stack, Grid, Page, Toolbar, Sidebar) take spacing and height. Color, border, shadow and type on them are still flagged, and Buttons, inputs and badges are unchanged. A mapped component with another name can opt in with `"sizedByCaller": true` in `zehn.project.json`.
- **Install without GitHub access (README, Option C):** `scripts/vendor.sh` copies the plugin into the app repo (`.claude/plugins/zehn-design/`) and registers it in `.claude/settings.json` with a repo-relative path; run it again with a new zip to update.

## 1.4.0 (15.10.2026)
From the PC thread's 1.2.0 round in the team repo (verdict: go).

- **Theme edits are noted:** changing a token file or the Tailwind config (the project's `tokens.sources`, `tokens.css`, `theme.*`, `tailwind.config.*`) shows a once-per-file "token change, designer sign-off needed" note, and the end-of-task check lists them.
- **Check gaps closed:** `tracking-*` is flagged in repos with their own tokens too (unless `tokens.trackingKeys` lists it); clickable `<div>`s and restyled Buttons are caught when the tag spans several lines.
- **setup-project:** adapts copied zehn components to the repo's own motion tokens, i18n labels and theme; re-checks the team's components against component fixes in this changelog (like the 1.2.0 TopBar active tab) and reports them for sign-off.
- **ObjectCard:** `title` takes a node, so module cards can show the `zehn/<app>` wordmark in the app accent.
- Tests: the design-system note shows the right folder on macOS (temp folders behind a symlink).

## 1.3.0 (15.10.2026)
From the designer's round 5 (zehn/task built from Figma) and their call: "if there are choices, ask them".

- **Ask at real forks:** when nothing decides it, the agent asks the developer one short question with a recommended pick, instead of guessing. The forks: an app with no accent, which frames of a big Figma link, a layout with no sibling or Figma to follow, building a missing component vs reusing the closest, and two equally good mappings in setup. Answers are saved in `zehn.project.json` (`app`, `decisions`), so nobody is asked twice. Small details are never asked.
- **App accents per repo:** anbar, abat and new modules get their accent from the developer during setup, saved in `app`.
- **Big Figma links:** compose-screen lists the frames and asks which to build, then reads them one at a time.
- **Style check:** raw `<button>`/`<input>`/`<select>` inside the shared folder are allowed only in the components that wrap them, so moving markup there no longer dodges the check. Restyling a component through `className` (colors, radius, padding, height, font) is flagged; layout classes are fine.
- **Rules:** user-picked data colors (board and label colors) may use the hue tokens; new shared components are built from the existing ones.

## 1.2.0 (15.10.2026)
From the designer's rounds 3 and 4 (the office welcome page, and the task and analytics module pages).

- **TopBar fix:** the active nav tab now shows its subtle fill. The ghost button's transparent background used to win. `buttonClass` has a `selected` option; disabled ghost buttons no longer stack two backgrounds either.
- **App accents:** office (Cyan, from the Figma logo), meet (Pink, from the Figma product tag), aip (the intelligence assistant, Cyan), `task` as an alias of tasks. anbar and abat stay on the default Cyan until the designer picks theirs.
- **Assistant orb:** `Orb` (default, listening, thinking) and `OrbLauncher`, from the Figma intelligence frames. Its glow uses the new `bg-ai-gradient` token, the one gradient the rules allow.
- **Theme switch:** `setTheme()` / `useTheme()` turn transitions off while light and dark swap, so hover colors don't animate across the page.
- **New patterns:** `AppSwitcher` (the cross-module sidebar in zehn office, active item neutral, each module in its own accent) and `ObjectCard` + `ObjectGrid` (the Figma Board Card, for boards, dashboards and projects).
- Style check: knows `bg-ai-gradient`.

## 1.1.0 (15.10.2026)
From the designer's own test (a Shopify admin screen rebuilt as zehn, plus a date range picker).

**Layout is a default, not a rule**
- Hard rules stay hard: tokens and styling, the team's components, nothing invented, black primary, accent list, formats, confirm before destructive actions, light/dark, accessibility.
- Layout (top bar or sidebar, page headers, HeaderPattern, stat cards, cards vs list vs table, widths, modal vs drawer) follows the app's sibling screens, then the app's Figma, then the zehn recipes. Agents may deviate when the content or the developer calls for it, with no pushback: one `Layout: <what>, <why>` line under Design gaps. Real nav items are never dropped to fit a pattern.
- ui-review asks about unexplained layout differences under "Needs a decision" and no longer "fixes" layouts to the recipes. The style check has no layout rules.

**Style check**
- Editing the shared components folder is now a note shown once per file, not a blocking error. Building a missing component there is allowed; it still goes under Design gaps. Whole-file mode prints the same note.
- New: `tracking-*` (zehn sets letter spacing in the preset), `<div>`/`<span>` with `onClick`, and pill-shaped clickable elements.

**Rules**
- Money in the data's own currency when it has one (`formatMoney(827, locale, 'USD')`); UZS stays the default. Never convert or relabel amounts.
- Narrow screens: no sideways scroll down to 1024px; rows wrap, extra nav goes into a `…` menu.
- Week starts on Monday; month and weekday names come from the locale.
- Which app: use the repo's `data-app`; for a new area, ask and use the closest app meanwhile.
- The empty-folder path is kept short: the plugin is built for existing projects.

## 1.0.0 (15.10.2026)
First production release, after the final stress test (12 runs with and without the plugin, plus CSS Modules, styled-components, shadcn and non-zehn repos).

**Style check**
- Runs only in zehn repos: a `zehn.project.json`, zehn enabled in `.claude/settings.json`, or `--zm-*` tokens. Elsewhere it is silent, and the session text is one line.
- Edits inside the shared components folder (`components.dir`, mapped imports) are flagged once per file: "designer sign-off needed".
- Gradients and pill (`rounded-full`) buttons and inputs are flagged. The AI components are exempt.
- Radius, font size, font weight and raw widths/heights are checked in project mode too, against the app's own keys (`tokens.radiusKeys`, `fontSizeKeys`, `fontWeights`, or read from its Tailwind config).
- With `tokens.sources`, only declared CSS variables pass, so made-up `var(--hr-anything)` is caught.
- Fewer false hits from the look-alike check: it skips skeletons, styled sub-parts and plain strings, and fires only when the new component renders the raw element or lives in a shared folder.
- New motion rules: no `transition-all`, no durations over 300ms, no width/height/margin animation, no bounce, no `scale(0)`, and a reduced-motion path for new animations.

**Motion (new)**
- `motion` skill: when to animate, easing and duration tables, recipes for modal, drawer, menu, tooltip, toast, press feedback, list changes, icon swaps, and reduced motion. Based on Emil Kowalski's guidance and the Figma prototypes, where navigation is instant and panels use 300ms ease-out.
- Tokens: `--zm-duration-fast|base|slow` (150/200/300ms), `--zm-ease-out|in-out|in`, `--zm-press-scale`. Tailwind: `duration-fast|base|slow`, `ease-out|in-out|in`, `scale-press`. All of them drop to 0 under reduced motion.
- Fallback components animate: Modal, AlertDialog, Drawer, Menu, Tooltip (an instant group after the first one), Toast, Switch, ProgressBar, and Button press feedback (`still` turns it off). New `usePresence` hook for exit animations.

**Rules**
- Who wins: the app's sibling screens now beat the catalog. If neighbours lack a pattern (HeaderPattern, stat cards), match them and list the gap.
- Build only what was asked: ideas go under "Suggestions", the data meaning stays as given, and shared components aren't restyled for one screen.
- Simpler substitutes (native inputs for a date-range picker) count as Design gaps. Design gaps also go in the commit message or PR body.
- `zehn-ignore` names a person, or "the user in this session".
- New craft details (§1a) from a foundations review: tabular numbers, 65ch prose, `…`, gap over margins, nested radius, disabled tokens rather than opacity, focus rings, one icon set, no `<div onClick>`. Also new: specific button and error copy, inline errors with an icon, 300ms search debounce, copy confirmation, a skip link, and text-only tooltips.

**setup-project**
- Records `motion` and `i18n` in `zehn.project.json`, plus the app's radius, type and weight keys.
- Handles an old or partial zehn install: a zehn preset that breaks the app's own classes, and stale copies.
- A primary that isn't black is reported as a designer decision and never changed silently.
- Fallback components are copied only into React + Tailwind apps; other stacks build in their own styling.

## 0.4.0 (14.10.2026)
Guardrails reframe: zehn guards the app's existing tokens, components and screens through `zehn.project.json`; `setup-tokens` became `setup-project`. Per-project install. "Who wins" order, radius table, accent list, `disabledReason`, warning RoleBanner.

## 0.3.0
Figma-matched cards (4px), badge, switch, toast; HeaderPattern, RoleBanner, en/ru/uz labels, `format*` helpers; layout tokens for charts and toasts.

## 0.2.0
Standard Tailwind spacing keys, new radius classes, `tailwind.preset.cjs`, Button `variant`, Badge `appearance`/`color`/`status`; raw-element and `!important` checks.

## 0.1.0
First version: tokens from Figma, compose-screen / ui-tweak / ui-review skills, style check hook.
