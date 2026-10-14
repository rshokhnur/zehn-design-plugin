import type { HTMLAttributes } from 'react';
import { cx } from './cx';

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  /** Visible label above the bar; also the accessible name. Without it pass aria-label. */
  label?: string;
  showValue?: boolean;
  size?: 'small' | 'medium';
}

export function ProgressBar({ value, max = 100, label, showValue, size = 'medium', className, ...rest }: ProgressBarProps) {
  const pct = Math.round((Math.min(Math.max(value, 0), max) / max) * 100);
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {(label || showValue) && (
        <div className="flex justify-between text-xs">
          <span className="text-text-secondary">{label}</span>
          {showValue && <span className="font-semibold tabular-nums text-text-primary">{pct}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={cx('w-full overflow-hidden rounded-full bg-progress-track', size === 'small' ? 'h-1' : 'h-2')}
        {...rest}
      >
        {/* The fill width is data, not a design value, so it is the one inline style. */}
        <div className="h-full rounded-full bg-progress-fill motion-safe:transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
