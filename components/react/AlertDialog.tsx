import { useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { useDialog } from './hooks';
import { Icon } from './Icon';
import { Button } from './Button';
import { useZehnLabels } from './locale';

export interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Names the action and the object: 'Delete board "Mobile app"?' */
  title: ReactNode;
  /** One line on the consequence. */
  subtitle?: ReactNode;
  /** The verb: "Delete", "Withdraw", "Reject"… */
  confirmLabel: string;
  /** Defaults to the locale's "Cancel". */
  cancelLabel?: string;
  icon?: string;
  /** Confirm is running: spinner on the confirm button. */
  loading?: boolean;
}

/** Confirm before every destructive action. Initial focus is on Cancel; the scrim does not close it. */
export function AlertDialog({ open, onClose, onConfirm, title, subtitle, confirmLabel, cancelLabel, icon = 'delete-bin', loading }: AlertDialogProps) {
  const labels = useZehnLabels();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { panelRef, onKeyDown } = useDialog(open, loading ? () => {} : onClose, cancelRef);
  const titleId = useId();
  const subtitleId = useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div aria-hidden className="absolute inset-0 bg-scrim" />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="relative flex w-alert-dialog max-w-full flex-col gap-6 rounded-xl bg-surface-raised p-6 shadow-300 outline-none"
      >
        <div className="flex gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-danger-bg text-xl text-status-danger">
            <Icon name={icon} />
          </span>
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-base font-semibold text-text-primary">
              {title}
            </h2>
            {subtitle && (
              <p id={subtitleId} className="text-sm text-text-secondary">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button ref={cancelRef} variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel ?? labels.cancel}
          </Button>
          <Button variant="destructive-primary" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
