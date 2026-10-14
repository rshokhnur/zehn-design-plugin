import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon, Spinner } from './Icon';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { useZehnLabels } from './locale';

export type ToastType = 'default' | 'info' | 'loading' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  type?: ToastType;
  title: string;
  subtitle?: string;
  /** One action button, e.g. { label: 'View', onClick }. */
  action?: { label: string; onClick: () => void };
  /** Error shortcut: adds a "Retry" action (localized). */
  onRetry?: () => void;
  /** ms. Default 5000, errors 8000, loading stays until updated or dismissed. */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastApi {
  toast: (opts: ToastOptions) => number;
  update: (id: number, opts: Partial<ToastOptions>) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

const icons: Record<ToastType, ReactNode> = {
  default: null,
  info: <Icon name="information" className="text-lg text-blue" />,
  loading: <Spinner className="text-lg text-text-secondary" />,
  success: <Icon name="checkbox-circle" className="text-lg text-green" />,
  warning: <Icon name="error-warning" className="text-lg text-orange" />,
  error: <Icon name="close-circle" className="text-lg text-red" />,
};

function defaultDuration(t: ToastItem) {
  if (t.duration !== undefined) return t.duration;
  if (t.type === 'loading') return Infinity;
  return t.type === 'error' ? 8000 : 5000;
}

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const labels = useZehnLabels();
  const type = item.type ?? 'default';
  const total = defaultDuration(item);
  const remaining = useRef(total);
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    remaining.current = defaultDuration(item);
  }, [item]);

  useEffect(() => {
    if (paused || !Number.isFinite(remaining.current)) return;
    started.current = Date.now();
    timer.current = setTimeout(onDismiss, remaining.current);
    return () => {
      clearTimeout(timer.current);
      remaining.current -= Date.now() - started.current;
    };
  }, [paused, item, onDismiss]);

  const action = item.action ?? (item.onRetry ? { label: labels.retry, onClick: item.onRetry } : undefined);

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex w-toast max-w-full items-start gap-3 rounded border border-border-default bg-surface-base px-4 py-3 shadow-200"
    >
      {icons[type] && <span className="flex h-6 shrink-0 items-center">{icons[type]}</span>}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-0.5">
        <p className="text-sm font-semibold text-text-primary">{item.title}</p>
        {item.subtitle && <p className="text-sm text-text-secondary">{item.subtitle}</p>}
        {action && (
          <Button
            size="small"
            variant="secondary"
            className="mt-2 self-start"
            onClick={() => {
              action.onClick();
              onDismiss();
            }}
          >
            {action.label}
          </Button>
        )}
      </div>
      <IconButton icon="close" size="small" aria-label={labels.dismissNotification} onClick={onDismiss} />
    </div>
  );
}

/** Wrap the app once (inside ZehnLocaleProvider if you use one). Toasts stack bottom-right, 432px wide. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const labels = useZehnLabels();
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((all) => all.filter((t) => t.id !== id)), []);
  const toast = useCallback((opts: ToastOptions) => {
    const id = nextId.current++;
    setItems((all) => [...all, { ...opts, id }]);
    return id;
  }, []);
  const update = useCallback(
    (id: number, opts: Partial<ToastOptions>) => setItems((all) => all.map((t) => (t.id === id ? { ...t, ...opts } : t))),
    [],
  );
  const api = useMemo(() => ({ toast, update, dismiss }), [toast, update, dismiss]);
  const dismissers = useRef(new Map<number, () => void>());
  const dismisserFor = (id: number) => {
    if (!dismissers.current.has(id)) dismissers.current.set(id, () => {
      dismissers.current.delete(id);
      dismiss(id);
    });
    return dismissers.current.get(id)!;
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <section
        aria-label={labels.notifications}
        className="pointer-events-none fixed bottom-6 left-6 right-6 z-50 flex flex-col items-end gap-2"
      >
        {items.map((t) => (
          <ToastView key={t.id} item={t} onDismiss={dismisserFor(t.id)} />
        ))}
      </section>
    </ToastContext.Provider>
  );
}
