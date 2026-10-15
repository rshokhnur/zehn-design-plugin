import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { useZehnLabels } from './locale';

export type DialogTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'ai';

export const toneClasses: Record<DialogTone, string> = {
  neutral: 'bg-secondary-bg text-text-primary',
  info: 'bg-status-info-bg text-status-info',
  success: 'bg-status-success-bg text-status-success',
  warning: 'bg-status-warning-bg text-status-warning',
  danger: 'bg-status-danger-bg text-status-danger',
  ai: 'bg-ai-bg text-ai',
};

/** Centered dialogs (Modal, AlertDialog). Enter: base + ease-out. Exit: fast + ease-in. Scrim and panel share timing. */
const dialogTiming = (shown: boolean) => (shown ? 'duration-base ease-out' : 'duration-fast ease-in');
export const overlayMotion = (shown: boolean) => cx('transition-opacity', dialogTiming(shown), shown ? 'opacity-100' : 'opacity-0');
/** Fade + scale from 0.95, no slide. */
export const dialogMotion = (shown: boolean) =>
  cx('transition', dialogTiming(shown), shown ? 'scale-100 opacity-100' : 'scale-95 opacity-0');

export interface DialogHeaderProps {
  titleId: string;
  subtitleId: string;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: string;
  tone?: DialogTone;
  onClose: () => void;
}

/** 64px header: tinted icon + title + subtitle + close. AI tone adds the pink wash. */
export function DialogHeader({ titleId, subtitleId, title, subtitle, icon, tone = 'neutral', onClose }: DialogHeaderProps) {
  const labels = useZehnLabels();
  return (
    <div
      className={cx(
        'flex h-16 shrink-0 items-center gap-3 border-b border-border-default px-6',
        tone === 'ai' && 'bg-ai-bg',
      )}
    >
      {icon && (
        <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base', toneClasses[tone])}>
          <Icon name={icon} />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 id={titleId} className="truncate text-base font-semibold text-text-primary">
          {title}
        </h2>
        {subtitle && (
          <p id={subtitleId} className="truncate text-sm text-text-secondary">
            {subtitle}
          </p>
        )}
      </div>
      <IconButton icon="close" aria-label={labels.close} onClick={onClose} />
    </div>
  );
}

/** Sticky 56px footer, right-aligned. Order: secondary Cancel, then the primary action. */
export function DialogFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 flex h-14 shrink-0 items-center justify-end gap-2 border-t border-border-default bg-surface-raised px-6">
      {children}
    </div>
  );
}
