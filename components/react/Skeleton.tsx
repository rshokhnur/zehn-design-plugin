import type { HTMLAttributes } from 'react';
import { cx } from './cx';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** text: 16px line · rect: card or block (radius 4, like cards) · circle: avatar. */
  shape?: 'text' | 'rect' | 'circle';
}

/** Loading placeholder. Size it with h and w classes. Wrap a loading region in aria-busy="true". */
export function Skeleton({ shape = 'text', className, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cx(
        'bg-secondary-bg-hover motion-safe:animate-pulse',
        shape === 'circle' ? 'rounded-full' : shape === 'text' ? 'h-4 w-full rounded' : 'rounded',
        className,
      )}
      {...rest}
    />
  );
}
