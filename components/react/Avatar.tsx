import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';
import { Counter } from './Counter';

export type AvatarSize = 16 | 20 | 24 | 32 | 48 | 64 | 96 | 128;

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Full name: used for initials and the accessible name. Always show it next to the avatar in lists. */
  name?: string;
  src?: string;
  /** Remix icon name for the icon type. */
  icon?: string;
  size?: AvatarSize;
  /** Online dot. */
  status?: boolean;
  counter?: number;
}

const sizes: Record<AvatarSize, string> = {
  16: 'h-4 w-4 text-xxs',
  20: 'h-5 w-5 text-xxs',
  24: 'h-6 w-6 text-xxs',
  32: 'h-8 w-8 text-xs',
  48: 'h-12 w-12 text-base',
  64: 'h-16 w-16 text-xl',
  96: 'h-24 w-24 text-3xl',
  128: 'h-32 w-32 text-4xl',
};

const dot: Record<AvatarSize, string> = {
  16: 'h-1.5 w-1.5', 20: 'h-1.5 w-1.5', 24: 'h-2 w-2', 32: 'h-2.5 w-2.5',
  48: 'h-3 w-3', 64: 'h-4 w-4', 96: 'h-5 w-5', 128: 'h-6 w-6',
};

// Initials avatars are tinted; the hue is picked from the name so a person keeps their color.
const tints = [
  'bg-cyan-fill-2 text-cyan', 'bg-blue-fill-2 text-blue', 'bg-violet-fill-2 text-violet', 'bg-pink-fill-2 text-pink',
  'bg-orange-fill-2 text-orange', 'bg-teal-fill-2 text-teal', 'bg-coral-fill-2 text-coral', 'bg-green-fill-2 text-green',
];

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function tintFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return tints[h % tints.length];
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { name, src, icon, size = 32, status, counter, className, ...rest },
  ref,
) {
  const look = src ? 'bg-secondary-bg' : name && !icon ? tintFor(name) : 'bg-secondary-bg text-text-secondary';
  return (
    <span
      ref={ref}
      role="img"
      aria-label={name ?? 'User'}
      className={cx('relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold', sizes[size], look, className)}
      {...rest}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full rounded-full object-cover" />
      ) : name && !icon ? (
        <span aria-hidden>{initials(name)}</span>
      ) : (
        <Icon name={icon ?? 'user'} />
      )}
      {status && (
        <span aria-hidden className={cx('absolute bottom-0 right-0 rounded-full border-2 border-surface-base bg-green', dot[size])} />
      )}
      {counter !== undefined && (
        <Counter value={counter} max={99} size="small" tone="filled" color="red" className="absolute -right-1 -top-1" />
      )}
    </span>
  );
});

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  people: Array<{ name: string; src?: string }>;
  size?: 16 | 20 | 24 | 32 | 48;
  /** How many avatars to show before "+N". */
  max?: number;
}

export function AvatarGroup({ people, size = 24, max = 4, className, ...rest }: AvatarGroupProps) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div role="group" aria-label={people.map((p) => p.name).join(', ')} className={cx('flex items-center -space-x-1.5', className)} {...rest}>
      {shown.map((p, i) => (
        <Avatar key={`${p.name}-${i}`} name={p.name} src={p.src} size={size} aria-hidden className="ring-2 ring-surface-base" />
      ))}
      {extra > 0 && (
        <span
          aria-hidden
          className={cx('relative inline-flex items-center justify-center rounded-full bg-secondary-bg-hover font-semibold text-text-secondary ring-2 ring-surface-base', sizes[size])}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
