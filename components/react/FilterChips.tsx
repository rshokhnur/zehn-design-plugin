import { cx } from './cx';
import { Button } from './Button';
import { useControllable } from './hooks';

export interface FilterChip {
  value: string;
  label: string;
  count?: number;
}

export interface FilterChipsProps {
  items: FilterChip[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  'aria-label': string;
  className?: string;
}

/** Single-select filter chips: small Buttons, active = primary, inactive = secondary, with a Counter. */
export function FilterChips({ items, value, defaultValue, onValueChange, className, ...aria }: FilterChipsProps) {
  const [current, setCurrent] = useControllable(value, defaultValue ?? items[0]?.value ?? '', onValueChange);
  return (
    <div role="group" aria-label={aria['aria-label']} className={cx('flex flex-wrap items-center gap-2', className)}>
      {items.map((it) => {
        const active = it.value === current;
        return (
          <Button
            key={it.value}
            size="small"
            variant={active ? 'primary' : 'secondary'}
            aria-pressed={active}
            counter={it.count}
            onClick={() => setCurrent(it.value)}
          >
            {it.label}
          </Button>
        );
      })}
    </div>
  );
}
