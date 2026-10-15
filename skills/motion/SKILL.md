---
name: motion
description: Add, fix or review animation in a zehn app - transitions, hover and press feedback, opening and closing modals, drawers, menus, popovers, tooltips and toasts, list changes, icon swaps, loading states, reduced motion. Uses the app's motion stack and tokens via zehn.project.json. Use when the task mentions animation, transition, motion, easing, duration, "make it smooth", "feels janky/slow", Framer Motion or prefers-reduced-motion.
---

# Motion, the zehn way

zehn motion is feedback, not decoration. It should go unnoticed: fast, eased, then out of the way. When in doubt, don't animate. Based on Emil Kowalski's interface animation practice, fitted to zehn: in the Figma prototypes page navigation is instant and in-page panels use a 300ms ease-out.

## 0. Before writing anything
1. **Read `zehn.project.json`.** `motion.library` says what the app animates with (`css`, `tailwind`, `framer-motion`/`motion`, `react-spring`), `motion.durations`/`motion.easings` its tokens, `motion.reducedMotion` whether reduced motion is handled globally. Missing `motion` → look at `package.json` and an existing modal or menu, and use that.
2. **Use the app's stack.** Never add an animation library for something a CSS transition can do. Never hand-roll springs when Motion is installed.
3. **Use the app's components.** If the mapped Modal, Drawer, Menu or Toast already animates, don't add a second animation on top. If it doesn't, animate it in the component once (that's a design-system change: Design gaps), not per screen.
4. **Tokens, not numbers.** Use the project's duration and easing tokens. zehn fallback: `--zm-duration-fast` 150ms, `--zm-duration-base` 200ms, `--zm-duration-slow` 300ms; `--zm-ease-out`, `--zm-ease-in-out`, `--zm-ease-in`; `--zm-press-scale` 0.96. Tailwind: `duration-fast|base|slow`, `ease-out|in-out|in`, `scale-press`. All durations drop to 0ms under reduced motion.

## 1. Should it animate at all?
| How often | Rule |
|---|---|
| Many times a day, or keyboard-driven (table row actions, arrow keys in menus and lists, tab or segment switches by keyboard, command menus, typing) | No animation. Speed wins. |
| Page navigation | Instant, as in Figma. No page transitions, no route fades. |
| Occasional (open a modal, drawer, menu, toast) | Standard motion below, 300ms max. |
| Rare (first-run empty state, success after a long flow) | May be a little richer, still 300ms max per piece. |
Animate only when it answers a question: where did this come from, did my click register, what changed. Otherwise cut it. Never animate the initial page load state.

## 2. Easing and duration
- Entering, exiting, opening, closing → `ease-out`. Exits may use `ease-in`, and only exits.
- Moving or resizing something already on screen (reorder, segment indicator, expanding row) → `ease-in-out`.
- Hover, color, border → `duration-fast`, default ease.
- Constant motion (spinner, progress tied to time) → `linear`.
| What | Enter | Exit |
|---|---|---|
| Hover, press, color, switch thumb | fast (150) | fast |
| Tooltip, menu, popover, select list | fast (150) | fast |
| Modal, alert dialog, toast | base (200) | fast (150) |
| Drawer, side panel, chat panel | slow (300) | base (200) |
Exits run faster and quieter than enters. Nothing in product UI goes over 300ms. If it feels slow, shorten it first.

## 3. Patterns
- **Modal / AlertDialog:** fade + scale 0.95 → 1, centered (no slide, no bounce). Scrim fades with exactly the same duration and easing as the panel.
- **Drawer:** slides from its edge (`translateX(100%)` → 0), scrim in sync. Must be interruptible: a transition on an open state, never keyframes.
- **Menu, popover, select list, date picker:** fade + scale 0.95 → 1 from the trigger side (`transform-origin` at the trigger; Radix `--radix-*-transform-origin`). The highlight inside moves instantly.
- **Tooltip:** fade + slight scale, fast. The first one waits for the delay; while one is open, the next opens instantly with no animation.
- **Toast:** in from the bottom edge (`translateY(16px)` + fade), out with a fade and a small move, faster. Stacked toasts move with transform, never re-layout.
- **Press feedback:** `active:scale-press` (0.96) with `transition-transform duration-fast` on buttons. Skip it in dense, high-frequency UI (table row actions, toolbars): zehn's Button has `still`. Never below 0.95.
- **List changes** (row added, removed, reordered): a fade + 8px move on the changed item only, base duration; siblings close the gap with transform (Motion: `layout`, `AnimatePresence mode="popLayout"`). Never stagger whole tables or re-animate rows that didn't change.
- **Expanding content** (accordion, "show more"): don't animate `height`. Use `grid-template-rows: 0fr → 1fr` or a fade of the content; or open instantly.
- **Icon swap** (copy → check, play → pause): cross-fade with scale 0.3 → 1 (+ a 2–3px blur if the stack allows), base duration, no bounce. Copy-to-clipboard shows the check for about 1.5s.
- **Loading:** Skeleton (pulse) for lists and cards, spinner only inside buttons (`loading`). Both stop under reduced motion. A wait over 400ms needs one of them.
- **Theme switch:** turn transitions off while swapping light/dark. zehn: `setTheme()` / `useTheme()` do it; next-themes: `disableTransitionOnChange`; otherwise one shared helper that suppresses transitions for a frame. Never per page.
- **Hover-only motion** (a lift, a reveal): only on real pointers (`@media (hover: hover) and (pointer: fine)`), and animate a child so the hover area doesn't move.

## 4. Hard rules (the style check flags these)
- Animate `transform` and `opacity` only (colors for hover). Never `width`, `height`, `top/left`, `margin`, `padding`, `max-height`.
- Name the properties: `transition-colors`, `transition-opacity`, `transition-transform`, `transition` (Tailwind's default set). Never `transition-all` or `transition: all`.
- No durations over 300ms (spinners and skeletons excepted). No arbitrary `duration-[..]`.
- Never start from `scale(0)`; start at 0.95–0.97 with opacity 0.
- No bounce in product UI (`animate-bounce`, `animate-ping`, spring `bounce` over 0.3). Default springs `{ type: "spring", duration: 0.5, bounce: 0 }`, only for drag and gestures.
- Every animation has a reduced-motion path. zehn tokens do this for you (durations become 0). Otherwise: `motion-reduce:` / `@media (prefers-reduced-motion: reduce)` turning the animation off, including fades; in Motion, `<MotionConfig reducedMotion="user">` at the app root or `useReducedMotion()`.
- Interactive state (open/close, toggles, hover) uses transitions, which reverse mid-way. Keyframes only for things that always finish (spinners, a one-time entrance).
- In React, never animate through state on every frame. Use CSS, WAAPI or the library's loop.

## 5. Review checklist
For each animation, in order: should it animate at all (frequency, keyboard)? Transform and opacity only? Easing matches enter / move / hover? Duration from the tokens, exit faster? Interruptible? Origin at the trigger? Reduced-motion path? Paired parts (panel + scrim) share timing? Report what you fix as a table: `| Before | After | Why |`.

End with **Design gaps**: any motion you added to a shared component, any pattern the app's components couldn't do, and anything above you didn't follow and why (or "Design gaps: none").
