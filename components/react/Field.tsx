import { useId } from 'react';
import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

export type FieldSize = 'medium' | 'large';

export interface FieldOwnProps {
  label?: ReactNode;
  /** Red * after the label; also set on the control. */
  required?: boolean;
  /** Small gray text on the right of the label row. */
  topHint?: ReactNode;
  /** Helper text under the field. */
  bottomHint?: ReactNode;
  /** true or a message. A message replaces bottomHint, in red with an icon. */
  error?: boolean | ReactNode;
  size?: FieldSize;
}

/** Ids for wiring label, hints and error to a control. */
export function useFieldIds(id: string | undefined, p: FieldOwnProps, extra?: string) {
  const auto = useId();
  const controlId = id ?? auto;
  const topId = p.topHint ? `${controlId}-top` : undefined;
  const bottomId = (p.error && p.error !== true) || p.bottomHint ? `${controlId}-hint` : undefined;
  const describedBy = [topId, bottomId, extra].filter(Boolean).join(' ') || undefined;
  return { controlId, topId, bottomId, describedBy };
}

/** The bordered box shared by Input, Select and Textarea. */
export function fieldBoxClass(size: FieldSize, invalid: boolean, disabled?: boolean) {
  return cx(
    'flex w-full items-center gap-2 rounded-lg border bg-surface-base px-3 text-sm text-text-primary',
    'focus-within:shadow-focus transition-colors duration-fast ease-out',
    size === 'large' ? 'h-10' : 'h-8',
    invalid ? 'border-status-danger' : 'border-border-strong focus-within:border-focus-ring',
    disabled && 'cursor-not-allowed bg-disabled-bg text-disabled-fg',
  );
}

export const controlClass =
  'min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary disabled:cursor-not-allowed disabled:text-disabled-fg';

interface FieldProps extends FieldOwnProps {
  ids: ReturnType<typeof useFieldIds>;
  className?: string;
  children: ReactNode;
  /** Right side of the bottom row, e.g. the Textarea "0/200" counter. */
  bottomRight?: ReactNode;
}

/** Label row + control + bottom hint/error. */
export function Field({ label, required, topHint, bottomHint, error, ids, className, children, bottomRight }: FieldProps) {
  const message = error && error !== true ? error : null;
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {(label || topHint) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && (
            <label htmlFor={ids.controlId} className="text-sm text-text-primary">
              {label}
              {required && (
                <span aria-hidden className="ml-0.5 text-status-danger">
                  *
                </span>
              )}
            </label>
          )}
          {topHint && (
            <span id={ids.topId} className="text-xs text-text-tertiary">
              {topHint}
            </span>
          )}
        </div>
      )}
      {children}
      {(message || bottomHint || bottomRight) && (
        <div className="flex items-start justify-between gap-2 text-xs">
          {message ? (
            <span id={ids.bottomId} className="flex items-center gap-1 text-status-danger">
              <Icon name="error-warning" className="text-sm" />
              {message}
            </span>
          ) : bottomHint ? (
            <span id={ids.bottomId} className="text-text-secondary">
              {bottomHint}
            </span>
          ) : (
            <span />
          )}
          {bottomRight}
        </div>
      )}
    </div>
  );
}
