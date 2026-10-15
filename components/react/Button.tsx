import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, MouseEvent, ReactElement, ReactNode } from 'react';
import { cx } from './cx';
import { Icon, Spinner } from './Icon';
import { Counter } from './Counter';
import { Tooltip } from './Tooltip';

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

/** Ghost in its selected state (the active nav tab): the fill replaces bg-transparent instead of fighting it. */
export const ghostSelectedClass = 'bg-surface-subtle hover:bg-surface-hover text-text-primary';

/** Variant colors, with `selected` swapping the ghost background. Other variants ignore `selected`. */
export function variantClass(variant: ButtonVariant, selected = false) {
  return selected && variant === 'ghost' ? ghostSelectedClass : variantClasses[variant];
}

/** Solid variants get the light-on-dark Counter tint. */
export const solidVariants: ButtonVariant[] = ['primary', 'color-primary', 'ai-primary', 'destructive-primary'];

const sizeClasses: Record<ButtonSize, string> = {
  large: 'h-10 px-4 gap-2 text-sm rounded-lg',
  medium: 'h-8 px-3 gap-1.5 text-sm rounded-lg',
  small: 'h-6 px-2 gap-1 text-xs rounded',
};

export const baseButtonClass =
  'relative inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold select-none ' +
  'focus-visible:outline-none focus-visible:shadow-focus';

/** Hover colors fade (fast). */
export const buttonColorMotion = 'transition-colors duration-fast ease-out';
/** Hover colors plus press feedback: scales to --zm-press-scale (0.96; 1 under reduced motion) while held. */
export const buttonPressMotion = 'transition duration-fast ease-out active:scale-press';

export const disabledButtonClass =
  'disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-disabled-fg ' +
  'aria-disabled:cursor-not-allowed aria-disabled:bg-disabled-bg aria-disabled:text-disabled-fg';

/** Ghost stays transparent when disabled, so it gets its own set rather than a second, conflicting disabled:bg-*. */
const ghostDisabledClass =
  'disabled:cursor-not-allowed disabled:bg-transparent disabled:text-disabled-fg ' +
  'aria-disabled:cursor-not-allowed aria-disabled:bg-transparent aria-disabled:text-disabled-fg';

/** Disabled styles for a variant; `loading` keeps the colors and shows a wait cursor. */
export function disabledClassFor(variant: ButtonVariant, loading = false) {
  if (loading) return variant === 'ghost' ? 'cursor-wait disabled:bg-transparent' : 'cursor-wait';
  return variant === 'ghost' ? ghostDisabledClass : disabledButtonClass;
}

/**
 * Soft-disabled button with a reason: stays focusable (aria-disabled), ignores clicks and shows the reason
 * in a Tooltip. A natively disabled button can't take focus, so a Tooltip on it never reaches keyboard users.
 */
export function withDisabledReason(button: ReactElement, reason: string | undefined) {
  return reason ? <Tooltip content={reason}>{button}</Tooltip> : button;
}

/**
 * Class string for a button-looking element (e.g. an <a> nav tab). `press` adds the press scale; off by default.
 * `selected` gives a ghost its filled state (active nav tab); pair it with aria-current or aria-pressed.
 * Don't pass a bg-* in `className` to change the fill: cx doesn't merge Tailwind classes, so it would fight the variant's.
 */
export function buttonClass({
  variant = 'secondary',
  size = 'medium',
  press = false,
  selected = false,
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; press?: boolean; selected?: boolean; className?: string } = {}) {
  return cx(baseButtonClass, sizeClasses[size], variantClass(variant, selected), press ? buttonPressMotion : buttonColorMotion, className);
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
  /** Use instead of `disabled` to say why the action is unavailable: the button stays focusable and shows this in a Tooltip. */
  disabledReason?: string;
  /** No press scale. For dense, high-frequency UI: table row actions, toolbars. Hover colors still fade. */
  still?: boolean;
}

const renderIcon = (icon: ButtonProps['leftIcon'], size: ButtonSize) =>
  typeof icon === 'string' ? <Icon name={icon} className={size === 'small' ? 'text-sm' : 'text-base'} /> : icon;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'medium', leftIcon, rightIcon, counter, loading = false, disabled, disabledReason, still = false, className, children, type = 'button', onClick, ...rest },
  ref,
) {
  const left = leftIcon === undefined && variant.startsWith('ai-') ? 'sparkling-2' : leftIcon;
  const reason = loading ? undefined : disabledReason;
  const press = !still && !disabled && !loading && !reason;
  return withDisabledReason(
    <button
      ref={ref}
      type={type}
      disabled={(disabled && !reason) || loading}
      aria-disabled={reason ? true : undefined}
      aria-busy={loading || undefined}
      onClick={reason ? (e: MouseEvent<HTMLButtonElement>) => e.preventDefault() : onClick}
      className={cx(
        buttonClass({ variant, size, press }),
        disabledClassFor(variant, loading),
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
    </button>,
    reason,
  );
});
