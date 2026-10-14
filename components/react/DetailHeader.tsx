import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { Menu } from './Menu';
import type { MenuItem } from './Menu';

export interface DetailHeaderProps {
  /** With a label: "< All requests" link. Without: a back icon button. */
  back?: { href?: string; onClick?: () => void; label?: string };
  /** "#REQ-3" */
  id?: string;
  title: string;
  /** Joined with " · ". */
  meta?: ReactNode[];
  /** Items for the `…` menu on the right. */
  menuItems?: MenuItem[];
  actions?: ReactNode;
  className?: string;
}

export function DetailHeader({ back, id, title, meta, menuItems, actions, className }: DetailHeaderProps) {
  return (
    <div className={cx('flex flex-col gap-3 border-b border-border-default pb-4', className)}>
      {back?.label && (
        <a
          href={back.href}
          onClick={back.onClick}
          className="inline-flex items-center gap-1 self-start rounded text-sm text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
        >
          <Icon name="arrow-left-s" className="text-base" />
          {back.label}
        </a>
      )}
      <div className="flex items-start gap-3">
        {back && !back.label && (
          <IconButton icon="arrow-left" aria-label="Back" variant="secondary" onClick={back.onClick ?? (() => back.href && window.location.assign(back.href))} />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {id && <span className="text-xs text-text-secondary">{id}</span>}
          <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
          {meta && meta.length > 0 && (
            <p className="flex flex-wrap items-center text-sm text-text-secondary">
              {meta.map((m, i) => (
                <Fragment key={i}>
                  {i > 0 && <span aria-hidden className="px-1.5">·</span>}
                  <span className="inline-flex items-center gap-1.5">{m}</span>
                </Fragment>
              ))}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {menuItems && menuItems.length > 0 && (
            <Menu items={menuItems} trigger={<IconButton icon="more-2" aria-label="More actions" />} />
          )}
        </div>
      </div>
    </div>
  );
}
