import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

export interface RoleBannerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  /** One line under the title. */
  description?: ReactNode;
  /** Buttons on the right, e.g. <Button size="small">Switch role</Button>. */
  actions?: ReactNode;
  /** Remix icon name shown before the title. */
  icon?: string;
  /** accent: app accent tint (default) · info: cyan tint. */
  tone?: 'accent' | 'info';
}

/** Tinted box that tells people which role or mode they're in, with optional actions. */
export function RoleBanner({ title, description, actions, icon, tone = 'accent', className, ...rest }: RoleBannerProps) {
  return (
    <div
      className={cx('flex items-center gap-3 rounded p-4', tone === 'info' ? 'bg-cyan-fill-2' : 'bg-app-accent-fill', className)}
      {...rest}
    >
      {icon && <Icon name={icon} className={cx('shrink-0 text-xl', tone === 'info' ? 'text-cyan' : 'text-app-accent')} />}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-base font-semibold text-text-primary">{title}</p>
        {description && <p className="text-sm text-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
