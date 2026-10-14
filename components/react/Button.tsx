import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { Icon, Spinner } from './Icon';
import { Counter } from './Counter';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'color-primary'
  | 'color-secondary'
  | 'ai-primary'
  | 'ai-secondary'
  | 'destructive-primary'
  | 'destructive-secondary';
export type ButtonSize = 'large' | 'medium' | 'small';

export const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-bg hover:bg-primary-bg-hover text-primary-fg',
  secondary: 'bg-secondary-bg hover:bg-secondary-bg-hover text-secondary-fg',
  ghost: 'bg-transparent hover:bg-surface-hover text-text-primary',
  'color-primary': 'bg-green hover:bg-green-darker text-white',
  'color-secondary': 'bg-green-fill-2 hover:bg-green-stroke text-green',
  'ai-primary': 'bg-ai hover:bg-pink-darker text-white',
  'ai-secondary': 'bg-ai-bg hover:bg-pink-stroke text-ai',
  'destructive-primary': 'bg-red hover:bg-red-darker text-white',
  'destructive-secondary': 'bg-red-fill-2 hover:bg-red-stroke text-red',
};

/** Solid variants get the light-on-dark Counter tint. */
export const solidVariants: ButtonVariant[] = ['primary', 'color-primary', 'ai-primary', 'destructive-primary'];

const sizeClasses: Record<ButtonSize, string> = {
  large: 'h-10 px-4 gap-2 text-sm rounded-lg',
  medium: 'h-8 px-3 gap-1.5 text-sm rounded-lg',
  small: 'h-6 px-2 gap-1 text-xs rounded',
};

export const baseButtonClass =
  'relative inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold select-none ' +
  'focus-visible:outline-none focus-visible:shadow-focus motion-safe:transition-colors';

export const disabledButtonClass = 'disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-disabled-fg';

/** Class string for a button-looking element (e.g. an <a> nav tab). */
export function buttonClass({
  variant = 'secondary',
  size = 'medium',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cx(baseButtonClass, sizeClasses[size], variantClasses[variant], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Remix icon name ("add") or a node. AI variants default to a sparkle; pass null to hide it. */
  leftIcon?: string | ReactNode;
  rightIcon?: string | ReactNode;
  counter?: number | string;
  /** Shows a spinner, keeps width and color, disables the button and sets aria-busy. */
  loading?: boolean;
}

const renderIcon = (icon: ButtonProps['leftIcon'], size: ButtonSize) =>
  typeof icon === 'string' ? <Icon name={icon} className={size === 'small' ? 'text-sm' : 'text-base'} /> : icon;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'medium', leftIcon, rightIcon, counter, loading = false, disabled, className, children, type = 'button', ...rest },
  ref,
) {
  const left = leftIcon === undefined && variant.startsWith('ai-') ? 'sparkling-2' : leftIcon;
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        buttonClass({ variant, size }),
        loading ? 'cursor-wait' : disabledButtonClass,
        variant === 'ghost' && 'disabled:bg-transparent',
        className,
      )}
      {...rest}
    >
      <span className={cx('inline-flex items-center', size === 'small' ? 'gap-1' : 'gap-1.5', loading && 'invisible')}>
        {left != null && renderIcon(left, size)}
        {children}
        {counter !== undefined && (
          <Counter
            value={counter}
            size={size === 'large' ? 'medium' : 'small'}
            color={solidVariants.includes(variant) ? 'white' : 'neutral'}
          />
        )}
        {rightIcon != null && renderIcon(rightIcon, size)}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner className={size === 'small' ? 'text-sm' : 'text-base'} />
        </span>
      )}
    </button>
  );
});
