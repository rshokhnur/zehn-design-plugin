import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, MouseEvent } from 'react';
import { cx } from './cx';
import { Icon, Spinner } from './Icon';
import { baseButtonClass, disabledButtonClass, variantClasses, withDisabledReason } from './Button';
import type { ButtonSize, ButtonVariant } from './Button';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Remix icon name, e.g. "close", "more-2", "arrow-left". */
  icon: string;
  /** Required: an icon-only button has no visible text. */
  'aria-label': string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Use instead of `disabled` to say why the action is unavailable: stays focusable and shows this in a Tooltip. */
  disabledReason?: string;
}

const sizes: Record<ButtonSize, string> = {
  large: 'h-10 w-10 rounded-lg text-xl',
  medium: 'h-8 w-8 rounded-lg text-base',
  small: 'h-6 w-6 rounded text-sm',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, variant = 'ghost', size = 'medium', loading = false, disabled, disabledReason, className, type = 'button', onClick, ...rest },
  ref,
) {
  const reason = loading ? undefined : disabledReason;
  return withDisabledReason(
    <button
      ref={ref}
      type={type}
      disabled={(disabled && !reason) || loading}
      aria-disabled={reason ? true : undefined}
      aria-busy={loading || undefined}
      onClick={reason ? (e: MouseEvent<HTMLButtonElement>) => e.preventDefault() : onClick}
      className={cx(
        baseButtonClass,
        sizes[size],
        variantClasses[variant],
        loading ? 'cursor-wait' : disabledButtonClass,
        variant === 'ghost' && 'disabled:bg-transparent aria-disabled:bg-transparent',
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : <Icon name={icon} />}
    </button>,
    reason,
  );
});
