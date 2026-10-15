import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: ReactNode;
}

/** Native radio. Group several with the same `name` inside a <fieldset> with a <legend>. */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, description, className, disabled, ...rest },
  ref,
) {
  return (
    <label className={cx('inline-flex items-start gap-2 text-sm', disabled ? 'cursor-not-allowed text-text-disabled' : 'cursor-pointer text-text-primary', className)}>
      <input
        ref={ref}
        type="radio"
        disabled={disabled}
        className={cx(
          'mt-0.5 h-4 w-4 shrink-0 cursor-pointer disabled:cursor-not-allowed appearance-none rounded-full border border-border-strong bg-surface-base',
          'checked:border-4 checked:border-primary-bg',
          'focus-visible:outline-none focus-visible:shadow-focus transition-colors duration-fast ease-out',
          'disabled:border-border-default disabled:bg-disabled-bg disabled:checked:border-disabled-fg',
        )}
        {...rest}
      />
      {(label || description) && (
        <span className="flex flex-col">
          {label}
          {description && <span className="text-xs text-text-secondary">{description}</span>}
        </span>
      )}
    </label>
  );
});
