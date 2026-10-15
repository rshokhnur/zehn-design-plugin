import type { ReactNode } from 'react';
import { cx } from './cx';
import { defaultRenderLink } from './link';
import type { RenderLink } from './link';

export interface ObjectCardProps {
  /** Text or a node, e.g. a `zehn/<app>` wordmark: <>zehn<span className="text-app-accent">/task</span></>. */
  title: ReactNode;
  /** Where the card goes. Pass `href` (a link) or `onOpen` (a button), not both. */
  href?: string;
  onOpen?: () => void;
  description?: ReactNode;
  /** One muted line, e.g. "4 widgets · Updated 05.08.2026". */
  meta?: ReactNode;
  /** Bottom row, e.g. an AvatarGroup. Not clickable on its own: clicks there open the card. */
  footer?: ReactNode;
  /** A Menu trigger (IconButton "more-2"). Stays clickable above the card link. */
  menu?: ReactNode;
  /** Shown after the title, e.g. a Badge. */
  badge?: ReactNode;
  /** 2px app-accent bar on top (task cards). */
  accentBar?: boolean;
  /** Router link for `href`. Default: a plain <a>. */
  renderLink?: RenderLink;
  className?: string;
}

// The title link's ::after covers the whole card, so the card is one click target and its focus ring wraps the card.
const stretched =
  'text-left after:absolute after:inset-0 after:rounded focus-visible:outline-none focus-visible:after:shadow-focus';

/** Generic object card for grids: boards, dashboards, projects (Figma BoardCard). Put it in an ObjectGrid. */
export function ObjectCard({
  title,
  href,
  onOpen,
  description,
  meta,
  footer,
  menu,
  badge,
  accentBar = false,
  renderLink = defaultRenderLink,
  className,
}: ObjectCardProps) {
  return (
    <article
      className={cx(
        'relative flex min-w-0 flex-col gap-2 rounded border border-border-default bg-surface-raised p-4',
        'transition-colors duration-fast ease-out hover:border-border-strong',
        className,
      )}
    >
      {accentBar && <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 rounded-t bg-app-accent" />}
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">
          {href
            ? renderLink({ href, className: stretched, children: title })
            : <button type="button" onClick={onOpen} className={stretched}>{title}</button>}
        </h3>
        {badge}
        {menu && <div className="relative z-10 -my-1.5 shrink-0">{menu}</div>}
      </div>
      {description && <p className="line-clamp-2 text-sm text-text-secondary">{description}</p>}
      {meta && <p className="text-xs text-text-tertiary">{meta}</p>}
      {footer && <div className="mt-auto flex items-center gap-2 pt-2">{footer}</div>}
    </article>
  );
}

export interface ObjectGridProps {
  children: ReactNode;
  className?: string;
}

/** Responsive card grid: 1 column, 2 from sm, 3 from xl. */
export function ObjectGrid({ children, className }: ObjectGridProps) {
  return <div className={cx('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}>{children}</div>;
}
