import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

export type InfoChipTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const tones: Record<InfoChipTone, string> = {
  neutral: 'bg-status-neutral-bg text-status-neutral',
  info: 'bg-status-info-bg text-status-info',
  success: 'bg-status-success-bg text-status-success',
  warning: 'bg-status-warning-bg text-status-warning',
  danger: 'bg-status-danger-bg text-status-danger',
};

export interface InfoChipProps {
  icon?: string;
  tone?: InfoChipTone;
  children: ReactNode;
  className?: string;
}

/** Tinted 12px chip under a field: "Available balance: 21 days". */
export function InfoChip({ icon = 'information', tone = 'info', children, className }: InfoChipProps) {
  return (
    <span className={cx('inline-flex items-center gap-1 self-start rounded px-2 py-1 text-xs', tones[tone], className)}>
      <Icon name={icon} className="text-sm" />
      {children}
    </span>
  );
}
