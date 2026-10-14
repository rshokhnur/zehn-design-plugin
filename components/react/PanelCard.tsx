import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

export interface PanelCardProps {
  title: string;
  icon?: string;
  /** Label (gray, left) / value (right) rows. */
  rows?: Array<{ label: string; value: ReactNode }>;
  children?: ReactNode;
  className?: string;
}

/** Side panel card for detail pages (Details, People, Activity). */
export function PanelCard({ title, icon, rows, children, className }: PanelCardProps) {
  return (
    <section className={cx('flex flex-col gap-3 rounded border border-border-default bg-surface-base p-4', className)}>
      <h2 className="flex items-center gap-2 text-sm text-text-secondary">
        {icon && <Icon name={icon} className="text-base" />}
        {title}
      </h2>
      {rows && rows.length > 0 && (
        <dl className="flex flex-col gap-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start justify-between gap-3 text-sm">
              <dt className="text-text-secondary">{r.label}</dt>
              <dd className="text-right text-text-primary">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
    </section>
  );
}
