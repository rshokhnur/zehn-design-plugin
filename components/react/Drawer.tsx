import { useId } from 'react';
import type { ReactNode, RefObject } from 'react';
import { cx } from './cx';
import { useDialog } from './hooks';
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

/** DrawerShell: long or multi-step create/edit. Full height, right side. */
export function Drawer({ open, onClose, title, subtitle, icon, tone, size = 'default', stepper, footer, initialFocusRef, closeOnScrim = true, children }: DrawerProps) {
  const { panelRef, onKeyDown } = useDialog(open, onClose, initialFocusRef);
  const titleId = useId();
  const subtitleId = useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div aria-hidden className="absolute inset-0 bg-scrim" onClick={closeOnScrim ? onClose : undefined} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cx('relative flex h-full max-w-full flex-col bg-surface-raised shadow-300 outline-none', size === 'wide' ? 'w-drawer-wide' : 'w-drawer')}
      >
        <DialogHeader {...{ titleId, subtitleId, title, subtitle, icon, tone, onClose }} />
        {stepper && <div className="shrink-0 border-b border-border-default px-6 py-3">{stepper}</div>}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </div>
    </div>
  );
}
