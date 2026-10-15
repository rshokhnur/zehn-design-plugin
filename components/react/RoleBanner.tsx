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
  /** accent: app accent tint, the viewer must act (default) · info: cyan tint · warning: view-only access. */
  tone?: 'accent' | 'info' | 'warning';
}

const tones = {
  accent: { bg: 'bg-app-accent-fill', icon: 'text-app-accent' },
  info: { bg: 'bg-cyan-fill-2', icon: 'text-cyan' },
  warning: { bg: 'bg-status-warning-bg', icon: 'text-status-warning' },
};

/** Tinted box that tells people which role or mode they're in, with optional actions. */
export function RoleBanner({ title, description, actions, icon, tone = 'accent', className, ...rest }: RoleBannerProps) {
  return (
    <div
      className={cx('flex items-center gap-3 rounded p-4', tones[tone].bg, className)}
      {...rest}
    >
      {icon && <Icon name={icon} className={cx('shrink-0 text-xl', tones[tone].icon)} />}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-base font-semibold text-text-primary">{title}</p>
        {description && <p className="text-sm text-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
