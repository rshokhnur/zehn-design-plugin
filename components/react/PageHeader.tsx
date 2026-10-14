import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

export interface PageHeaderProps {
  title: string;
  /** Gray line with live counts: "1 request waiting on you". */
  subtitle?: ReactNode;
  /** Remix icon name, shown 32px in the app accent. */
  icon?: string;
  /** Right side. Put the primary (black) button last. */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cx('flex items-center justify-between gap-6', className)}>
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden className="h-10 w-0.5 shrink-0 rounded-full bg-app-accent" />
        {icon && (
          <span aria-hidden className="flex h-header-icon w-header-icon shrink-0 items-center justify-center text-header-icon text-app-accent">
            <Icon name={icon} />
          </span>
        )}
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-2xl font-semibold text-text-primary">{title}</h1>
          {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
