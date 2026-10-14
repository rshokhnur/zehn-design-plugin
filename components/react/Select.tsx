import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';
import { Field, controlClass, fieldBoxClass, useFieldIds } from './Field';
import type { FieldOwnProps } from './Field';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>, FieldOwnProps {
  leftIcon?: string;
  /** Shown as a disabled first option when nothing is selected. */
  placeholder?: string;
  className?: string;
  selectClassName?: string;
}

/** Native <select> styled like Input, with a right chevron. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, required, topHint, bottomHint, error, size = 'medium', leftIcon, placeholder, id, className, selectClassName, disabled, children, ...rest },
  ref,
) {
  const ids = useFieldIds(id, { topHint, bottomHint, error });
  return (
    <Field {...{ label, required, topHint, bottomHint, error, ids, className }}>
      <div className={cx(fieldBoxClass(size, !!error, disabled), 'relative')}>
        {leftIcon && <Icon name={leftIcon} className="text-base text-text-tertiary" />}
        <select
          ref={ref}
          id={ids.controlId}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy}
          className={cx(controlClass, 'h-full cursor-pointer appearance-none pr-6', selectClassName)}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <Icon name="arrow-down-s" className="pointer-events-none absolute right-3 text-base text-text-tertiary" />
      </div>
    </Field>
  );
});
