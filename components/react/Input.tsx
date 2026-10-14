import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';
import { Field, controlClass, fieldBoxClass, useFieldIds } from './Field';
import type { FieldOwnProps } from './Field';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, FieldOwnProps {
  /** Remix icon names, e.g. leftIcon="search". */
  leftIcon?: string;
  rightIcon?: string;
  /** Class for the outer wrapper (label + box + hint). Use it for layout, e.g. "flex-1". */
  className?: string;
  inputClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, required, topHint, bottomHint, error, size = 'medium', leftIcon, rightIcon, id, className, inputClassName, disabled, ...rest },
  ref,
) {
  const ids = useFieldIds(id, { topHint, bottomHint, error });
  return (
    <Field {...{ label, required, topHint, bottomHint, error, ids, className }}>
      <div className={fieldBoxClass(size, !!error, disabled)}>
        {leftIcon && <Icon name={leftIcon} className="text-base text-text-tertiary" />}
        <input
          ref={ref}
          id={ids.controlId}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy}
          className={cx(controlClass, 'h-full', inputClassName)}
          {...rest}
        />
        {rightIcon && <Icon name={rightIcon} className="text-base text-text-tertiary" />}
      </div>
    </Field>
  );
});
