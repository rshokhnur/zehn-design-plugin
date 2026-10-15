import { useId } from 'react';
import type { ReactNode, RefObject } from 'react';
import { cx } from './cx';
import { useDialog, usePresence } from './hooks';
import { DialogFooter, DialogHeader } from './DialogParts';
import type { DialogTone } from './DialogParts';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: string;
  tone?: DialogTone;
  /** default 520 · wide 640 (when it holds a table). */
  size?: 'default' | 'wide';
  /** Multi-step: a stepper rendered under the header. */
  stepper?: ReactNode;
  footer?: ReactNode;
  initialFocusRef?: RefObject<HTMLElement>;
  closeOnScrim?: boolean;
  children: ReactNode;
}

/**
 * DrawerShell: long or multi-step create/edit. Full height, right side.
 * Motion: slides in from the right (slow, ease-out), out faster (base, ease-in); the scrim fades in sync.
 * CSS transitions, so reopening mid-exit reverses from where it is. Already open on first render: no animation.
 */
export function Drawer({ open, onClose, title, subtitle, icon, tone, size = 'default', stepper, footer, initialFocusRef, closeOnScrim = true, children }: DrawerProps) {
  const { mounted, state } = usePresence(open, 'base');
  const { panelRef, onKeyDown } = useDialog(open && mounted, onClose, initialFocusRef);
  const titleId = useId();
  const subtitleId = useId();
  if (!mounted) return null;
  const shown = state === 'open';
  const timing = shown ? 'duration-slow ease-out' : 'duration-base ease-in';
  return (
    <div data-state={state} className={cx('fixed inset-0 z-50 flex justify-end', !open && 'pointer-events-none')}>
      <div
        aria-hidden
        className={cx('absolute inset-0 bg-scrim transition-opacity', timing, shown ? 'opacity-100' : 'opacity-0')}
        onClick={closeOnScrim ? onClose : undefined}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cx(
          'relative flex h-full max-w-full flex-col bg-surface-raised shadow-300 outline-none transition-transform',
          size === 'wide' ? 'w-drawer-wide' : 'w-drawer',
          timing,
          shown ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <DialogHeader {...{ titleId, subtitleId, title, subtitle, icon, tone, onClose }} />
        {stepper && <div className="shrink-0 border-b border-border-default px-6 py-3">{stepper}</div>}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </div>
    </div>
  );
}
