import { cloneElement, useEffect, useId, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { cx } from './cx';
import { usePresence } from './hooks';

/** Shared across tooltips: while one is open, or one closed under 300ms ago, the next opens at once, unanimated. */
const WARM_MS = 300;
let openTooltips = 0;
let lastClosedAt = 0;
const isWarm = () => openTooltips > 0 || Date.now() - lastClosedAt < WARM_MS;

export interface TooltipProps {
  content: ReactNode;
  /** One focusable element (Button, IconButton, link). It gets aria-describedby. */
  children: ReactElement;
  side?: 'top' | 'bottom';
  /** Delay before showing on hover, in ms. */
  delay?: number;
  className?: string;
}

/**
 * Dark tooltip. Shows on hover (after `delay`) and keyboard focus; Escape hides it.
 * Motion: fades and scales 0.95 → 1 from its arrow side (fast). Moving between tooltips skips the delay and the animation.
 */
export function Tooltip({ content, children, side = 'top', delay = 300, className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [instant, setInstant] = useState(false);
  const { mounted, state } = usePresence(open, instant ? 0 : 'fast');
  const id = useId();
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = (wait: number) => {
    clearTimeout(timer.current);
    const warm = isWarm();
    setInstant(warm);
    if (warm) setOpen(true);
    else timer.current = setTimeout(() => setOpen(true), wait);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return;
    openTooltips += 1;
    return () => {
      openTooltips -= 1;
      lastClosedAt = Date.now();
    };
  }, [open]);
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
        data-state={state}
        className={cx(
          'pointer-events-none absolute left-1/2 z-50 w-max max-w-64 -translate-x-1/2 rounded bg-tooltip-bg px-2 py-1 text-xs text-tooltip-fg shadow-200',
          side === 'top' ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top',
          instant ? 'transition-none' : 'transition duration-fast',
          state === 'open' ? 'scale-100 opacity-100 ease-out' : 'scale-95 opacity-0 ease-in',
          !mounted && 'hidden',
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
