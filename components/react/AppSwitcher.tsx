import { Fragment } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';
import { Badge } from './Badge';
import { defaultRenderLink } from './link';
import type { RenderLink } from './link';
import { useZehnLabels } from './locale';

export interface AppSwitcherApp {
  /** The app key, also its data-app value (office, meet, aip, task…), so `/<name>` takes that app's accent. */
  id: string;
  name: string;
  href: string;
  /** Remix icon name; the current app shows its -fill variant. */
  icon: string;
  /** e.g. "Beta". Violet badge, never the accent. */
  badge?: string;
}

export interface AppSwitcherProps {
  apps: AppSwitcherApp[];
  /** id of the app the user is in. */
  current: string;
  /** Shown at the bottom, e.g. "v2.4.0". */
  version?: string;
  /** Router link. Default: a plain <a>. */
  renderLink?: RenderLink;
  'aria-label'?: string;
  className?: string;
}

const fillIcon = (name: string) => `${name.replace(/-(line|fill)$/, '')}-fill`;

/**
 * Cross-module switcher (zehn office): a 240px column listing the modules as `zehn/<name>`, each in its own accent.
 * The current one is a neutral fill with a filled icon and aria-current="page", never the accent fill.
 * Plain links, so the keyboard order is the normal tab order.
 */
export function AppSwitcher({ apps, current, version, renderLink = defaultRenderLink, className, ...aria }: AppSwitcherProps) {
  const labels = useZehnLabels();
  return (
    <nav
      aria-label={aria['aria-label'] ?? labels.apps}
      className={cx('flex h-full w-60 shrink-0 flex-col border-r border-border-default bg-surface-base', className)}
    >
      <ul className="flex flex-1 flex-col gap-1 p-3">
        {apps.map((app) => {
          const active = app.id === current;
          return (
            <li key={app.id} data-app={app.id}>
              {renderLink({
                href: app.href,
                'aria-current': active ? 'page' : undefined,
                className: cx(
                  'flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-text-primary',
                  'transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:shadow-focus',
                  active ? 'bg-surface-subtle' : 'hover:bg-surface-hover',
                ),
                children: (
                  <Fragment>
                    <Icon name={active ? fillIcon(app.icon) : app.icon} className="text-xl" />
                    <span className="min-w-0 truncate">
                      zehn<span className="text-app-accent">/{app.name}</span>
                    </span>
                    {app.badge && (
                      <Badge size="small" color="violet" className="ml-auto">
                        {app.badge}
                      </Badge>
                    )}
                  </Fragment>
                ),
              })}
            </li>
          );
        })}
      </ul>
      {version && <p className="px-6 pb-4 text-xs text-text-tertiary">{version}</p>}
    </nav>
  );
}
