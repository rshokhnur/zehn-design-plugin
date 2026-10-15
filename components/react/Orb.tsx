import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cx } from './cx';

export type OrbState = 'default' | 'listening' | 'thinking';
export type OrbSize = 'launcher' | 'hero';

export interface OrbProps {
  state?: OrbState;
  /** launcher = 64px, hero = 128px (the Figma core). */
  size?: OrbSize;
  /** Accessible name. Leave it out when visible text next to the orb already names it: the orb is then hidden from screen readers. */
  'aria-label'?: string;
  className?: string;
}

const sizes: Record<OrbSize, { box: string; sheen: string }> = {
  launcher: { box: 'h-16 w-16', sheen: 'blur-md' },
  hero: { box: 'h-32 w-32', sheen: 'blur-xl' },
};

/**
 * The zehn intelligence assistant orb: an ai-gradient sphere with a blurred glow behind it.
 * Only for the intelligence assistant (rules §7). Never rebuild it by hand or use the gradient anywhere else.
 * - default: glow the size of the core.
 * - listening: glow grows to about 1.5× and pulses.
 * - thinking: glow grows and turns.
 * The glow grows with a transform (slow, ease-in-out); the loops are motion-safe, so they stop under reduced motion.
 */
export function Orb({ state = 'default', size = 'hero', className, ...aria }: OrbProps) {
  const label = aria['aria-label'];
  const active = state !== 'default';
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-state={state}
      className={cx('relative inline-flex shrink-0', sizes[size].box, className)}
    >
      {/* Glow: the outer layer scales (so the state change can transition), the inner one loops. */}
      <span
        aria-hidden
        className={cx(
          'pointer-events-none absolute inset-0 transition-transform duration-slow ease-in-out',
          active ? 'scale-150' : 'scale-100',
        )}
      >
        <span
          className={cx(
            'absolute inset-0 rounded-full bg-ai-gradient opacity-60 blur-3xl',
            state === 'listening' && 'motion-safe:animate-pulse',
            state === 'thinking' && 'motion-safe:animate-spin',
          )}
        />
      </span>
      {/* Core: the gradient sphere with a soft white sheen near the top. */}
      <span aria-hidden className="relative h-full w-full overflow-hidden rounded-full bg-ai-gradient shadow-200">
        <span className={cx('absolute left-1/4 top-0 h-1/2 w-1/2 rounded-full bg-alpha-400', sizes[size].sheen)} />
      </span>
    </span>
  );
}

export interface OrbLauncherProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> {
  /** Required: the launcher has no visible text, e.g. "Ask zehn intelligence". */
  'aria-label': string;
  state?: OrbState;
}

/**
 * 64px orb button fixed bottom-right (bottom-6 right-6) that opens the assistant through onClick.
 * Sits below modals, drawers and toasts (z-40). Only for the intelligence assistant.
 */
export const OrbLauncher = forwardRef<HTMLButtonElement, OrbLauncherProps>(function OrbLauncher(
  { state = 'default', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'fixed bottom-6 right-6 z-40 inline-flex rounded-full',
        'transition-transform duration-fast ease-out active:scale-press',
        'focus-visible:outline-none focus-visible:shadow-focus',
        className,
      )}
      {...rest}
    >
      <Orb state={state} size="launcher" />
    </button>
  );
});
