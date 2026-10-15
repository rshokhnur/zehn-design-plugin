import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { buttonClass } from './Button';
import { IconButton } from './IconButton';
import { Counter } from './Counter';
import { Avatar } from './Avatar';
import { useZehnLabels } from './locale';

export interface TopBarNavItem {
  label: string;
  icon?: string;
  href: string;
  active?: boolean;
}

export interface TopBarProps {
  /** App name after the logo, shown in the app accent: zehn/procurement. */
  app: string;
  homeHref?: string;
  nav: TopBarNavItem[];
  unreadCount?: number;
  onNotificationsClick?: () => void;
  onSupportClick?: () => void;
  user: { name: string; src?: string };
  /** Extra right-side content before the bell. */
  right?: ReactNode;
}

const Divider = () => <span aria-hidden className="h-4 w-px bg-border-default" />;

/** 56px app shell bar. Nav = ghost tabs, the active one filled. No sidebars. */
export function TopBar({ app, homeHref = '/', nav, unreadCount = 0, onNotificationsClick, onSupportClick, user, right }: TopBarProps) {
  const labels = useZehnLabels();
  return (
    <header className="flex h-topbar-height shrink-0 items-center gap-4 border-b border-border-default bg-surface-base px-6">
      <a href={homeHref} className="rounded text-base font-semibold text-text-primary focus-visible:outline-none focus-visible:shadow-focus">
        zehn<span className="text-app-accent">/{app}</span>
      </a>
      <Divider />
      <nav aria-label={labels.mainNav} className="flex min-w-0 flex-1 items-center gap-1">
        {nav.map((item) => (
          <a
            key={item.href}
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            className={buttonClass({ variant: 'ghost', selected: item.active, className: 'gap-1.5' })}
          >
            {item.icon && <Icon name={item.icon} className="text-base" />}
            {item.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        {right}
        <span className="relative inline-flex">
          <IconButton
            icon="notification-3"
            aria-label={unreadCount ? labels.notificationsUnread(unreadCount) : labels.notifications}
            onClick={onNotificationsClick}
          />
          {unreadCount > 0 && (
            <Counter aria-hidden value={unreadCount} max={99} size="small" tone="filled" color="red" className="pointer-events-none absolute -right-1 -top-1" />
          )}
        </span>
        <Divider />
        <button type="button" onClick={onSupportClick} className={buttonClass({ variant: 'ghost' })}>
          {labels.support}
        </button>
        <Avatar name={user.name} src={user.src} size={32} />
      </div>
    </header>
  );
}
