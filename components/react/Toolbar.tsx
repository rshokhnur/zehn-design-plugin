import type { ReactNode } from 'react';
import { cx } from './cx';
import { IconButton } from './IconButton';
import { useZehnLabels } from './locale';

export interface ToolbarProps {
  /** In order: SegmentedControl or FilterChips · search Input (className="flex-1") · filter Selects · Pager. */
  children: ReactNode;
  'aria-label'?: string;
  className?: string;
}

export function Toolbar({ children, className, ...aria }: ToolbarProps) {
  const labels = useZehnLabels();
  return (
    <div role="group" aria-label={aria['aria-label'] ?? labels.tableControls} className={cx('flex flex-wrap items-center gap-3', className)}>
      {children}
    </div>
  );
}

export interface PagerProps {
  /** 1-based. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** `< 1 / 45 >` pager for the toolbar. */
export function Pager({ page, pageCount, onPageChange, className }: PagerProps) {
  const labels = useZehnLabels();
  return (
    <nav aria-label={labels.pagination} className={cx('flex items-center gap-1 text-sm text-text-secondary', className)}>
      <IconButton icon="arrow-left-s" size="small" aria-label={labels.previousPage} disabled={page <= 1} onClick={() => onPageChange(page - 1)} />
      <span className="px-1 tabular-nums" aria-current="page">
        <span className="font-semibold text-text-primary">{page}</span> / {pageCount}
      </span>
      <IconButton icon="arrow-right-s" size="small" aria-label={labels.nextPage} disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} />
    </nav>
  );
}
