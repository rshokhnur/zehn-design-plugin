import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cx } from './cx';

export type CounterSize = 'small' | 'medium' | 'large';
export type CounterTone = 'tinted' | 'filled';
export type CounterColor = 'neutral' | 'white' | 'red';

export interface CounterProps extends HTMLAttributes<HTMLSpanElement> {
  size?: CounterSize;
  tone?: CounterTone;
  /** white = on a solid button (Button sets it). red + filled = notification counter. No accent: the app accent never marks counts. */
  color?: CounterColor;
  value: number | string;
  /** Caps the number, e.g. max 99 → "99+". */
  max?: number;
}

const sizes: Record<CounterSize, string> = {
  small: 'h-4 min-w-4 px-1 text-xxs',
  medium: 'h-5 min-w-5 px-1.5 text-xs',
  large: 'h-6 min-w-6 px-2 text-xs',
};

const colors: Record<CounterTone, Record<CounterColor, string>> = {
  tinted: {
    neutral: 'bg-secondary-bg-hover text-text-secondary',
    white: 'bg-action-counter-bg text-primary-fg',
    red: 'bg-red-fill-2 text-red',
  },
  filled: {
    neutral: 'bg-primary-bg text-primary-fg',
    white: 'bg-primary-fg text-primary-bg',
    red: 'bg-counter-bg text-counter-fg',
  },
};

export const Counter = forwardRef<HTMLSpanElement, CounterProps>(function Counter(
  { size = 'medium', tone = 'tinted', color = 'neutral', value, max, className, ...rest },
  ref,
) {
  const shown = typeof value === 'number' && max !== undefined && value > max ? `${max}+` : value;
  return (
    <span
      ref={ref}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold tabular-nums',
        sizes[size],
        colors[tone][color],
        className,
      )}
      {...rest}
    >
      {shown}
    </span>
  );
});
