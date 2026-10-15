import { useCallback, useEffect, useState } from 'react';

export type ZehnTheme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'zehn-theme';

function readStored(): ZehnTheme {
  try {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
  }
}

/**
 * Switches the theme on <html>: `light` / `dark` set data-theme, `system` removes it (tokens.css then follows
 * prefers-color-scheme). Every transition is turned off for that one switch, so hover fades and other color
 * transitions don't animate the whole page into the new theme. No-op on the server.
 */
export function setTheme(theme: ZehnTheme) {
  if (typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.appendChild(
    document.createTextNode('*,*::before,*::after{transition:none!important}'), // zehn-ignore: requested by the designer, transitions off during a theme switch
  );
  document.head.appendChild(style);

  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);

  // Force a style recalc so the new colors apply with transitions off, then restore transitions next frame.
  void window.getComputedStyle(document.body).opacity;
  requestAnimationFrame(() => style.remove());
}

/**
 * [theme, setTheme] persisted to localStorage ('zehn-theme'). Starts as 'system' on the server and the first
 * render, then picks up the stored value after mount (no hydration mismatch). To avoid a flash, also apply the
 * stored theme in an inline script in <head> before the app loads.
 */
export function useTheme() {
  const [theme, setState] = useState<ZehnTheme>('system');

  useEffect(() => {
    const stored = readStored();
    setState(stored);
    setTheme(stored);
  }, []);

  const update = useCallback((next: ZehnTheme) => {
    setState(next);
    setTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked (private mode, policy): the theme still applies for this page.
    }
  }, []);

  return [theme, update] as const;
}
