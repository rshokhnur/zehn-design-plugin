import { cloneElement, Fragment, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent as ReactMouseEvent, ReactElement, ReactNode, Ref } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';
import { mergeRefs, usePresence } from './hooks';

export interface MenuItem {
  label: string;
  /** Second line (two-line rows). */
  description?: string;
  icon?: string;
  /** Right add-on: shortcut text, Badge, Counter… */
  right?: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  /** Red, always moved last after a divider. */
  destructive?: boolean;
}

export interface MenuProps {
  /** A button element, e.g. <IconButton icon="more-2" aria-label="Actions" />. */
  trigger: ReactElement;
  items: MenuItem[];
  /** Small gray note at the bottom. */
  footnote?: ReactNode;
  align?: 'start' | 'end';
  className?: string;
}

/**
 * Dropdown menu. Motion: fades and scales 0.95 → 1 from the trigger's corner (fast, ease-out), exits with ease-in.
 * Moving the highlight with the keyboard or pointer is instant.
 */
export function Menu({ trigger, items, footnote, align = 'end', className }: MenuProps) {
  const [open, setOpen] = useState(false);
  const { mounted, state } = usePresence(open, 'fast');
  const visible = open && mounted;
  const menuId = useId();
  const triggerRef = useRef<HTMLElement>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pendingFocus = useRef<'first' | 'last'>('first');

  const regular = items.filter((i) => !i.destructive);
  const destructive = items.filter((i) => i.destructive);
  const ordered = [...regular, ...destructive];
  const enabled = ordered.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);

  const focusAt = (i: number | undefined) => i !== undefined && itemRefs.current[i]?.focus();
  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!visible) return;
    focusAt(pendingFocus.current === 'first' ? enabled[0] : enabled[enabled.length - 1]);
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const openWith = (where: 'first' | 'last') => {
    pendingFocus.current = where;
    setOpen(true);
  };

  const onMenuKeyDown = (e: KeyboardEvent) => {
    const pos = enabled.indexOf(itemRefs.current.findIndex((el) => el === document.activeElement));
    const keys: Record<string, () => void> = {
      ArrowDown: () => focusAt(enabled[(pos + 1) % enabled.length]),
      ArrowUp: () => focusAt(enabled[(pos - 1 + enabled.length) % enabled.length]),
      Home: () => focusAt(enabled[0]),
      End: () => focusAt(enabled[enabled.length - 1]),
      Escape: () => close(),
      Tab: () => close(false),
    };
    const fn = keys[e.key];
    if (!fn) return;
    if (e.key !== 'Tab') e.preventDefault();
    e.stopPropagation();
    fn();
  };

  const t = trigger as ReactElement & { ref?: Ref<HTMLElement> };
  const triggerEl = cloneElement(t, {
    ref: mergeRefs(t.ref, triggerRef),
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': open ? menuId : undefined,
    onClick: (e: ReactMouseEvent) => {
      t.props.onClick?.(e);
      if (open) setOpen(false);
      else openWith('first');
    },
    onKeyDown: (e: KeyboardEvent) => {
      t.props.onKeyDown?.(e);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openWith(e.key === 'ArrowDown' ? 'first' : 'last');
      }
    },
  });

  const renderItem = (it: MenuItem, i: number) => (
    <button
      key={`${it.label}-${i}`}
      ref={(el) => {
        itemRefs.current[i] = el;
      }}
      type="button"
      role="menuitem"
      tabIndex={-1}
      disabled={it.disabled}
      onClick={() => {
        close();
        it.onSelect?.();
      }}
      className={cx(
        'flex w-full items-center gap-2 rounded px-2 text-left text-sm outline-none',
        it.description ? 'py-1.5' : 'h-8',
        it.destructive ? 'text-status-danger' : 'text-text-primary',
        'hover:bg-surface-hover focus:bg-surface-hover disabled:cursor-not-allowed disabled:text-text-disabled',
      )}
    >
      {it.icon && <Icon name={it.icon} className={cx('text-base', !it.destructive && 'text-text-secondary')} />}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{it.label}</span>
        {it.description && <span className="truncate text-xs text-text-secondary">{it.description}</span>}
      </span>
      {it.right && <span className="text-xs text-text-tertiary">{it.right}</span>}
    </button>
  );

  return (
    <span ref={rootRef} className={cx('relative inline-flex', className)}>
      {triggerEl}
      {mounted && (
        <div
          id={menuId}
          role="menu"
          aria-orientation="vertical"
          data-state={state}
          onKeyDown={onMenuKeyDown}
          className={cx(
            'absolute top-full z-50 mt-1 flex w-56 flex-col rounded-lg border border-border-default bg-surface-overlay p-1 shadow-300',
            align === 'end' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
            'transition duration-fast',
            state === 'open' ? 'scale-100 opacity-100 ease-out' : 'scale-95 opacity-0 ease-in',
            !open && 'pointer-events-none',
          )}
        >
          {regular.map((it, i) => renderItem(it, i))}
          {destructive.length > 0 && (
            <Fragment>
              {regular.length > 0 && <div role="separator" className="my-1 h-px bg-border-default" />}
              {destructive.map((it, i) => renderItem(it, regular.length + i))}
            </Fragment>
          )}
          {footnote && <p className="px-2 pb-1 pt-2 text-xs text-text-tertiary">{footnote}</p>}
        </div>
      )}
    </span>
  );
}
