import type { ReactNode } from 'react';
import { cx } from './cx';
import { Badge } from './Badge';
import type { BadgeStatus } from './Badge';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  /** Optional delta badge, e.g. { label: '+12%', status: 'success' }. */
  delta?: { label: string; status?: BadgeStatus; icon?: string };
  /** The first card in a row: accent tint + accent label. */
  highlighted?: boolean;
  className?: string;
}

/** 288×96 stat tile. Put 3–5 in a flex row; they share the width. */
export function StatCard({ label, value, delta, highlighted, className }: StatCardProps) {
  return (
    <div
      className={cx(
        'flex h-24 min-w-0 shrink grow basis-72 flex-col justify-between rounded p-4',
        highlighted ? 'bg-app-accent-fill' : 'border border-border-default bg-surface-base',
        className,
      )}
    >
      <span className={cx('text-sm', highlighted ? 'text-app-accent' : 'text-text-secondary')}>{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-semibold tabular-nums text-text-primary">{value}</span>
        {delta && (
          <Badge size="small" status={delta.status ?? 'neutral'} leftIcon={delta.icon ?? null}>
            {delta.label}
          </Badge>
        )}
      </div>
    </div>
  );
}
