import { forwardRef, useState } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cx } from './cx';
import { Field, controlClass, useFieldIds } from './Field';
import type { FieldOwnProps } from './Field';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, Omit<FieldOwnProps, 'size'> {
  className?: string;
  textareaClassName?: string;
}

/** Same props as Input without icons. With maxLength it shows a "0/200" counter. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, required, topHint, bottomHint, error, id, className, textareaClassName, disabled, maxLength, value, defaultValue, onChange, rows = 4, ...rest },
  ref,
) {
  const [innerLen, setInnerLen] = useState(String(defaultValue ?? '').length);
  const length = value !== undefined ? String(value).length : innerLen;
  const ids = useFieldIds(id, { topHint, bottomHint, error });
  const counterId = maxLength ? `${ids.controlId}-count` : undefined;
  const describedBy = [ids.topId, ids.bottomId, counterId].filter(Boolean).join(' ') || undefined;
  return (
    <Field
      {...{ label, required, topHint, bottomHint, error, ids, className }}
      bottomRight={
        maxLength ? (
          <span id={counterId} className={cx('tabular-nums', length >= maxLength ? 'text-status-danger' : 'text-text-tertiary')}>
            {length}/{maxLength}
          </span>
        ) : undefined
      }
    >
      <textarea
        ref={ref}
        id={ids.controlId}
        rows={rows}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(e) => {
          setInnerLen(e.target.value.length);
          onChange?.(e);
        }}
        className={cx(
          controlClass,
          'w-full resize-y rounded-lg border bg-surface-base px-3 py-2 focus:shadow-focus motion-safe:transition-shadow',
          error ? 'border-status-danger' : 'border-border-strong focus:border-focus-ring',
          disabled && 'bg-disabled-bg',
          textareaClassName,
        )}
        {...rest}
      />
    </Field>
  );
});
