import type { ReactNode } from 'react';
import { cx } from './cx';
import { IconButton } from './IconButton';
import { Menu } from './Menu';
import type { MenuItem } from './Menu';
import { Skeleton } from './Skeleton';
import { useZehnLabels } from './locale';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right';
  /** Class for this column's cells, e.g. "w-40". */
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Accessible table name (visually hidden). */
  caption: string;
  /** 36px rows instead of 48. */
  dense?: boolean;
  /** Last-column `…` menu: Edit, then a red Delete (destructive items move last automatically). */
  rowActions?: (row: T) => MenuItem[];
  /** Name used in the row menu label, e.g. "Actions for #REQ-3" (localized). Defaults to the row id. */
  getRowLabel?: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  /** Shown in place of rows when there are none (e.g. an EmptyState). */
  empty?: ReactNode;
  className?: string;
}

/** Full-width data table. First column bold; use a Badge for the status column. */
export function DataTable<T>({ columns, rows, getRowId, caption, dense, rowActions, getRowLabel, onRowClick, loading, empty, className }: DataTableProps<T>) {
  const labels = useZehnLabels();
  const rowH = dense ? 'h-row-dense' : 'h-row';
  const colCount = columns.length + (rowActions ? 1 : 0);
  return (
    <div className={cx('w-full overflow-x-auto rounded border border-border-default bg-surface-base', className)}>
      <table className="w-full border-collapse text-sm" aria-busy={loading || undefined}>
        <caption className="sr-only">
          {caption}
          {loading && `, ${labels.loading}`}
        </caption>
        <thead>
          <tr className="h-table-header bg-surface-subtle">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cx('px-3 text-xs font-semibold text-text-secondary', c.align === 'right' ? 'text-right' : 'text-left', c.className)}
              >
                {c.header}
              </th>
            ))}
            {rowActions && (
              <th scope="col" className="w-12 px-3">
                <span className="sr-only">{labels.actions}</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className={cx(rowH, 'border-b border-border-default last:border-b-0')}>
                  {Array.from({ length: colCount }, (_, j) => (
                    <td key={j} className="px-3">
                      <Skeleton className="h-3" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.length === 0 && empty
              ? (
                  <tr>
                    <td colSpan={colCount} className="px-3 py-12">
                      {empty}
                    </td>
                  </tr>
                )
              : rows.map((row) => (
                  <tr
                    key={getRowId(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cx(rowH, 'border-b border-border-default last:border-b-0', onRowClick && 'cursor-pointer hover:bg-surface-hover')}
                  >
                    {columns.map((c, i) => (
                      <td
                        key={c.key}
                        className={cx(
                          'px-3',
                          i === 0 ? 'font-semibold text-text-primary' : 'text-text-primary',
                          c.align === 'right' && 'text-right tabular-nums',
                          c.className,
                        )}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Menu
                          items={rowActions(row)}
                          trigger={
                            <IconButton still icon="more-2" size="small" aria-label={labels.actionsFor(getRowLabel ? getRowLabel(row) : getRowId(row))} />
                          }
                        />
                      </td>
                    )}
                  </tr>
                ))}
        </tbody>
      </table>
    </div>
  );
}
