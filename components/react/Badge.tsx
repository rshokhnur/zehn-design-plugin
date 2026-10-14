import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

export type BadgeColor = 'neutral' | 'red' | 'green' | 'peach' | 'teal' | 'yellow' | 'coral' | 'pink' | 'blue' | 'violet';
export type BadgeAppearance = 'tinted' | 'filled' | 'ghost';
export type BadgeStatus = 'success' | 'warning' | 'info' | 'danger' | 'neutral';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'small' | 'medium';
  appearance?: BadgeAppearance;
  /** No accent: the app accent is never used on badges. */
  color?: BadgeColor;
  /** Shortcut: sets a tinted color and a default icon (override with leftIcon). */
  status?: BadgeStatus;
  leftIcon?: string | null;
  rightIcon?: string;
  children?: ReactNode;
}

// As in Figma: tinted = the 20% stroke color as fill + hue text; filled = hue fill + dark text; ghost = hue text.
// peach → orange hue, yellow → lime hue.
const palette: Record<BadgeColor, Record<BadgeAppearance, string>> = {
  neutral: { tinted: 'bg-gray-100 text-text-secondary', filled: 'bg-primary-bg text-primary-fg', ghost: 'text-text-secondary' },
  red: { tinted: 'bg-red-stroke text-red', filled: 'bg-red text-alpha-900', ghost: 'text-red' },
  green: { tinted: 'bg-green-stroke text-green', filled: 'bg-green text-alpha-900', ghost: 'text-green' },
  peach: { tinted: 'bg-orange-stroke text-orange', filled: 'bg-orange text-alpha-900', ghost: 'text-orange' },
  teal: { tinted: 'bg-teal-stroke text-teal', filled: 'bg-teal text-alpha-900', ghost: 'text-teal' },
  yellow: { tinted: 'bg-lime-stroke text-lime', filled: 'bg-lime text-alpha-900', ghost: 'text-lime' },
  coral: { tinted: 'bg-coral-stroke text-coral', filled: 'bg-coral text-alpha-900', ghost: 'text-coral' },
  pink: { tinted: 'bg-pink-stroke text-pink', filled: 'bg-pink text-alpha-900', ghost: 'text-pink' },
  blue: { tinted: 'bg-blue-stroke text-blue', filled: 'bg-blue text-alpha-900', ghost: 'text-blue' },
  violet: { tinted: 'bg-violet-stroke text-violet', filled: 'bg-violet text-alpha-900', ghost: 'text-violet' },
};

const statusMap: Record<BadgeStatus, { hue: BadgeColor; icon: string }> = {
  success: { hue: 'green', icon: 'checkbox-circle' },
  warning: { hue: 'peach', icon: 'time' },
  info: { hue: 'blue', icon: 'information' },
  danger: { hue: 'red', icon: 'close-circle' },
  neutral: { hue: 'neutral', icon: 'pause-circle' },
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { size = 'medium', appearance, color, status, leftIcon, rightIcon, className, children, ...rest },
  ref,
) {
  const s = status ? statusMap[status] : undefined;
  const look = status ? 'tinted' : appearance ?? 'tinted';
  const left = leftIcon === undefined ? s?.icon : leftIcon;
  const iconSize = size === 'small' ? 'text-xs' : 'text-sm';
  return (
    <span
      ref={ref}
      className={cx(
        'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded font-semibold',
        size === 'small' ? 'h-5 px-1.5 text-xs' : 'h-6 px-2 text-sm',
        look === 'ghost' && 'px-0',
        palette[color ?? s?.hue ?? 'neutral'][look],
        className,
      )}
      {...rest}
    >
      {left && <Icon name={left} className={iconSize} />}
      {children}
      {rightIcon && <Icon name={rightIcon} className={iconSize} />}
    </span>
  );
});
