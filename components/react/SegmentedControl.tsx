import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';
import { Counter } from './Counter';
import { useControllable } from './hooks';

export interface SegmentedItem {
  value: string;
  label: string;
  icon?: string;
  counter?: number;
  /** id of the tabpanel this tab controls. */
  panelId?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  /** 2–5 items. In-page views and sections only, never app navigation. */
  items: SegmentedItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  size?: 'small' | 'medium' | 'large';
  'aria-label': string;
  className?: string;
}

const sizes = {
  small: { track: 'h-6', item: 'px-2 text-xs gap-1 rounded' },
  medium: { track: 'h-8', item: 'px-3 text-sm gap-1.5 rounded-lg' },
  large: { track: 'h-10', item: 'px-4 text-sm gap-2 rounded-lg' },
};

export function SegmentedControl({ items, value, defaultValue, onValueChange, size = 'medium', className, ...aria }: SegmentedControlProps) {
  const [current, setCurrent] = useControllable(value, defaultValue ?? items[0]?.value ?? '', onValueChange);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const pos = enabled.indexOf(index);
    let next: number | undefined;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = enabled[(pos + 1) % enabled.length];
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = enabled[(pos - 1 + enabled.length) % enabled.length];
    else if (e.key === 'Home') next = enabled[0];
    else if (e.key === 'End') next = enabled[enabled.length - 1];
    if (next === undefined) return;
    e.preventDefault();
    refs.current[next]?.focus();
    setCurrent(items[next].value);
  };

  return (
    <div
      role="tablist"
      aria-label={aria['aria-label']}
      className={cx('inline-flex items-stretch gap-0.5 rounded-lg bg-bg-segment-track p-0.5', sizes[size].track, className)}
    >
      {items.map((it, i) => {
        const selected = it.value === current;
        return (
          <button
            key={it.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={it.panelId}
            tabIndex={selected ? 0 : -1}
            disabled={it.disabled}
            onClick={() => setCurrent(it.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cx(
              'inline-flex items-center justify-center whitespace-nowrap font-semibold focus-visible:outline-none focus-visible:shadow-focus motion-safe:transition-colors',
              sizes[size].item,
              selected ? 'bg-surface-raised text-text-primary shadow-100' : 'text-text-secondary hover:text-text-primary',
              'disabled:cursor-not-allowed disabled:text-text-disabled',
            )}
          >
            {it.icon && <Icon name={it.icon} className={size === 'small' ? 'text-sm' : 'text-base'} />}
            {it.label}
            {it.counter !== undefined && <Counter value={it.counter} size="small" />}
          </button>
        );
      })}
    </div>
  );
}
