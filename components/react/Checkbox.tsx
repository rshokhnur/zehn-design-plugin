import { forwardRef, useEffect, useRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';
import { mergeRefs } from './hooks';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: ReactNode;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, indeterminate = false, className, disabled, ...rest },
  ref,
) {
  const inner = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <label className={cx('inline-flex items-start gap-2 text-sm', disabled ? 'cursor-not-allowed text-text-disabled' : 'cursor-pointer text-text-primary', className)}>
      <span className="relative mt-0.5 inline-flex h-4 w-4 shrink-0">
        <input
          ref={mergeRefs(ref, inner)}
          type="checkbox"
          disabled={disabled}
          aria-checked={indeterminate ? 'mixed' : undefined}
          className={cx(
            'peer h-4 w-4 cursor-pointer disabled:cursor-not-allowed appearance-none rounded border border-border-strong bg-surface-base',
            'checked:border-primary-bg checked:bg-primary-bg indeterminate:border-primary-bg indeterminate:bg-primary-bg',
            'focus-visible:outline-none focus-visible:shadow-focus motion-safe:transition-colors',
            'disabled:border-border-default disabled:bg-disabled-bg disabled:checked:bg-disabled-fg disabled:checked:border-disabled-fg',
            'disabled:indeterminate:bg-disabled-fg disabled:indeterminate:border-disabled-fg',
          )}
          {...rest}
        />
        <Icon
          name={indeterminate ? 'subtract' : 'check'}
          className={cx(
            'pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-primary-fg',
            indeterminate ? 'flex' : 'hidden peer-checked:flex',
          )}
        />
      </span>
      {(label || description) && (
        <span className="flex flex-col">
          {label}
          {description && <span className="text-xs text-text-secondary">{description}</span>}
        </span>
      )}
    </label>
  );
});
