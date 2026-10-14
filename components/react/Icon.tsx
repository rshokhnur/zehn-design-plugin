import { cx } from './cx';

export interface IconProps {
  /** Remix Icon name without prefix/suffix: "close" → ri-close-line. A name ending in -fill or -line is used as is. */
  name: string;
  className?: string;
}

export function iconClass(name: string) {
  return /-(line|fill)$/.test(name) ? `ri-${name}` : `ri-${name}-line`;
}

/** Decorative Remix icon (aria-hidden). Size follows the font size of the parent. */
export function Icon({ name, className }: IconProps) {
  return <i className={cx(iconClass(name), 'leading-none', className)} aria-hidden />;
}

export function Spinner({ className }: { className?: string }) {
  return <Icon name="loader-4" className={cx('motion-safe:animate-spin', className)} />;
}
