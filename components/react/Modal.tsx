import { useId } from 'react';
import type { ReactNode, RefObject } from 'react';
import { cx } from './cx';
import { useDialog, usePresence } from './hooks';
import { DialogFooter, DialogHeader, dialogMotion, overlayMotion } from './DialogParts';
import type { DialogTone } from './DialogParts';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Remix icon name for the tinted header icon. */
  icon?: string;
  tone?: DialogTone;
  /** default 520 · wide 600 · xl 904 (two-column). */
  size?: 'default' | 'wide' | 'xl';
  /** Footer buttons: <Button>Cancel</Button><Button variant="primary">Save</Button>. */
  footer?: ReactNode;
  /** Element focused on open. Otherwise the first [data-autofocus] element, else the panel. */
  initialFocusRef?: RefObject<HTMLElement>;
  /** Close when the scrim is clicked. Default true. */
  closeOnScrim?: boolean;
  children: ReactNode;
}

const widths = { default: 'w-modal', wide: 'w-modal-wide', xl: 'w-modal-xl' };

/**
 * ModalShell: short create/edit (up to ~8 fields).
 * Motion: scrim and panel fade, panel scales 0.95 → 1 (base, ease-out); exit is faster (fast, ease-in).
 * A modal that is already open on its first render shows without animating.
 */
export function Modal({ open, onClose, title, subtitle, icon, tone, size = 'default', footer, initialFocusRef, closeOnScrim = true, children }: ModalProps) {
  const { mounted, state } = usePresence(open, 'fast');
  const { panelRef, onKeyDown } = useDialog(open && mounted, onClose, initialFocusRef);
  const titleId = useId();
  const subtitleId = useId();
  if (!mounted) return null;
  const shown = state === 'open';
  return (
    <div data-state={state} className={cx('fixed inset-0 z-50 flex items-center justify-center p-6', !open && 'pointer-events-none')}>
      <div aria-hidden className={cx('absolute inset-0 bg-scrim', overlayMotion(shown))} onClick={closeOnScrim ? onClose : undefined} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cx('relative flex max-h-full max-w-full flex-col overflow-hidden rounded-xl bg-surface-raised shadow-300 outline-none', widths[size], dialogMotion(shown))}
      >
        <DialogHeader {...{ titleId, subtitleId, title, subtitle, icon, tone, onClose }} />
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </div>
    </div>
  );
}
