import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  /** One line of copy. */
  description?: ReactNode;
  /** Optional small button. */
  action?: ReactNode;
  /** Soft glow behind the icon. Default true. */
  blur?: boolean;
  className?: string;
}

/** Centered empty state. Keep the page header, search and filters above it. */
export function EmptyState({ icon = 'inbox', title, description, action, blur = true, className }: EmptyStateProps) {
  return (
    <div className={cx('flex flex-col items-center gap-4 text-center', className)}>
      <div aria-hidden className="relative flex h-64 w-64 items-center justify-center">
        {blur && <div className="absolute inset-16 rounded-full bg-cyan-fill-2 blur-2xl" />}
        <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border-default bg-surface-raised text-3xl text-text-secondary shadow-200">
          <Icon name={icon} />
        </span>
      </div>
      <div className="flex max-w-80 flex-col gap-1">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {description && <p className="text-sm text-text-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}
