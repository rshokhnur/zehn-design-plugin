import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, MutableRefObject, Ref, RefObject } from 'react';

/** Controlled/uncontrolled state in one hook. */
export function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? (value as T) : inner;
  const set = useCallback(
    (v: T) => {
      if (!controlled) setInner(v);
      onChange?.(v);
    },
    [controlled, onChange],
  );
  return [current, set] as const;
}

/** Combines several refs (forwarded + local) into one callback ref. */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const r of refs) {
      if (typeof r === 'function') r(node);
      else if (r) (r as MutableRefObject<T | null>).current = node;
    }
  };
}

export type MotionDuration = 'fast' | 'base' | 'slow';

const durationVar: Record<MotionDuration, string> = {
  fast: '--zm-duration-fast',
  base: '--zm-duration-base',
  slow: '--zm-duration-slow',
};
const fallbackMs: Record<MotionDuration, number> = { fast: 150, base: 200, slow: 300 };

/** True when the user asked the OS for reduced motion. */
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A motion token in ms, read from the live CSS variable (--zm-duration-fast etc.), so it follows overrides and is
 * 0 under prefers-reduced-motion. Numbers pass through. Use it for timeouts that wait for a CSS transition.
 */
export function motionMs(duration: MotionDuration | number) {
  if (prefersReducedMotion()) return 0;
  if (typeof duration === 'number') return duration;
  if (typeof document === 'undefined') return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(durationVar[duration]).trim();
  if (!raw) return fallbackMs[duration];
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return fallbackMs[duration];
  return raw.endsWith('ms') ? n : n * 1000;
}

export type PresenceState = 'open' | 'closed';

/**
 * Mount/unmount with enter and exit transitions (CSS transitions, so they stay interruptible).
 * - Opening: mounts with state 'closed', flips to 'open' two frames later so the closed styles are painted first.
 * - Closing: state goes 'closed' at once; the element stays mounted for `exit` (a motion token or ms), then unmounts.
 *   The wait is a timeout, not transitionend, and is 0 under reduced motion.
 * - `appear`: when `open` is already true on the first render, animate in anyway. Default false: render open, no motion.
 * Style the element from `state` (e.g. opacity-0 vs opacity-100) and put it on `data-state`.
 */
export function usePresence(open: boolean, exit: MotionDuration | number = 'base', { appear = false } = {}) {
  const [mounted, setMounted] = useState(open);
  const [state, setState] = useState<PresenceState>(open && !appear ? 'open' : 'closed');

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    setState('closed');
    const t = setTimeout(() => setMounted(false), motionMs(exit));
    return () => clearTimeout(t);
  }, [open, exit]);

  useEffect(() => {
    if (!open || !mounted) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setState('open'));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [open, mounted]);

  return { mounted, state };
}

export const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Shared modal behaviour for Modal, Drawer and AlertDialog. Pass `open && mounted` from usePresence so the
 * panel exists when focus moves in; focus returns to the opener as soon as closing starts.
 * initial focus ([data-autofocus], initialFocusRef or the panel), Tab focus trap,
 * Escape closes, body scroll lock, focus returns to the opener on close.
 */
export function useDialog(
  open: boolean,
  onClose: () => void,
  initialFocusRef?: RefObject<HTMLElement>,
) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const target =
      initialFocusRef?.current ?? panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel;
    target?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open, initialFocusRef]);

  const onKeyDown = useCallback((e: ReactKeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCloseRef.current();
      return;
    }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    e.stopPropagation();
    if (!items.length) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  return { panelRef, onKeyDown };
}
