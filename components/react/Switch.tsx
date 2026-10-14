import { forwardRef, useId } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { useControllable } from './hooks';

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value' | 'defaultValue'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: 'medium' | 'small';
  label?: ReactNode;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, defaultChecked = false, onCheckedChange, size = 'medium', label, disabled, className, id, onClick, ...rest },
  ref,
) {
  const [on, setOn] = useControllable(checked, defaultChecked, onCheckedChange);
  const auto = useId();
  const labelId = `${id ?? auto}-label`;
  const medium = size === 'medium';
  return (
    <span className={cx('inline-flex items-center gap-2 text-sm', disabled ? 'text-text-disabled' : 'text-text-primary', className)}>
      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={label ? labelId : undefined}
        disabled={disabled}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) setOn(!on);
        }}
        className={cx(
          'inline-flex shrink-0 items-center rounded-full p-0.5 focus-visible:outline-none focus-visible:shadow-focus motion-safe:transition-colors',
          medium ? 'h-5 w-9' : 'h-4 w-7',
          on ? 'bg-primary-bg' : 'bg-border-strong',
          disabled && 'cursor-not-allowed bg-disabled-bg',
        )}
        {...rest}
      >
        <span
          aria-hidden
          className={cx(
            'rounded-full shadow-100 motion-safe:transition-transform',
            medium ? 'h-4 w-4' : 'h-3 w-3',
            on ? cx('bg-primary-fg', medium ? 'translate-x-4' : 'translate-x-3') : 'translate-x-0 bg-white',
            disabled && 'bg-disabled-fg',
          )}
        />
      </button>
      {label && (
        <span id={labelId} onClick={() => !disabled && setOn(!on)} className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}>
          {label}
        </span>
      )}
    </span>
  );
});
