import { cloneElement, useEffect, useId, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { cx } from './cx';

export interface TooltipProps {
  content: ReactNode;
  /** One focusable element (Button, IconButton, link). It gets aria-describedby. */
  children: ReactElement;
  side?: 'top' | 'bottom';
  /** Delay before showing on hover, in ms. */
  delay?: number;
  className?: string;
}

/** Dark tooltip. Shows on hover and keyboard focus; Escape hides it. */
export function Tooltip({ content, children, side = 'top', delay = 300, className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = (wait: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), wait);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const describedBy = [children.props['aria-describedby'], id].filter(Boolean).join(' ');

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => show(delay)}
      onMouseLeave={hide}
      onFocus={() => show(0)}
      onBlur={hide}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          hide();
        }
      }}
    >
      {cloneElement(children, { 'aria-describedby': describedBy })}
      <span
        id={id}
        role="tooltip"
        className={cx(
          'pointer-events-none absolute left-1/2 z-50 w-max max-w-64 -translate-x-1/2 rounded bg-tooltip-bg px-2 py-1 text-xs text-tooltip-fg shadow-200',
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          !open && 'hidden',
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
