import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';
import { toneClasses } from './DialogParts';
import type { DialogTone } from './DialogParts';

export interface ActivityItemProps {
  icon: string;
  tone?: DialogTone;
  name: string;
  /** "approved the request" */
  action: ReactNode;
  /** Display text, e.g. "30.06.2026 14:27". */
  timestamp: string;
  /** ISO value for <time dateTime>. */
  dateTime?: string;
  /** Hides the vertical rule under the last item. */
  last?: boolean;
}

/** One event in an <ActivityFeed>: 32px circle icon on a vertical rule, Name + action, timestamp. */
export function ActivityItem({ icon, tone = 'neutral', name, action, timestamp, dateTime, last }: ActivityItemProps) {
  return (
    <li className={cx('relative flex gap-3', !last && 'pb-4')}>
      {!last && <span aria-hidden className="absolute bottom-0 left-4 top-8 w-px bg-border-default" />}
      <span className={cx('relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base', toneClasses[tone])}>
        <Icon name={icon} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5 pt-1.5">
        <p className="text-sm text-text-primary">
          <span className="font-semibold">{name}</span> {action}
        </p>
        <time dateTime={dateTime} className="text-xs text-text-secondary">
          {timestamp}
        </time>
      </div>
    </li>
  );
}

export function ActivityFeed({ children, className, ...rest }: { children: ReactNode; className?: string; 'aria-label'?: string }) {
  return (
    <ol className={cx('flex flex-col', className)} {...rest}>
      {children}
    </ol>
  );
}
