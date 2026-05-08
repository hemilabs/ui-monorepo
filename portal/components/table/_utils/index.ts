import { type ColumnDef } from '@tanstack/react-table'

// Stable reference for the empty-data branch of getSafeData. Passing a fresh
// `[]` literal to useReactTable invalidates getCoreRowModel's memo every render
// and triggers an infinite render loop via _autoResetPageIndex → setPagination.
const emptyArray: unknown[] = []

/**
 * Selects the array passed to useReactTable. Preserves referential stability:
 * the empty branch always returns the same module-level reference so consumers
 * don't trip useReactTable's getCoreRowModel memo invalidation.
 */
export function getSafeData<TData>(
  data: TData[] | undefined,
  showSkeleton: boolean,
  skeletonArray: TData[],
): TData[] {
  if (data && data.length > 0) {
    return data
  }
  if (showSkeleton) {
    return skeletonArray
  }
  return emptyArray as TData[]
}

/**
 * Determines the column order for a table based on screen width and priority columns.
 * Returns the new column order only when the width exceeds the breakpoint and priority columns are provided.
 * Otherwise, returns undefined (so the default order is used by react-table).
 *
 * @template T - The type of data being displayed in the table
 * @param {Object} params - Configuration object for column ordering
 * @param {number} params.breakpoint - Minimum screen width required to apply column ordering
 * @param {ColumnDef<T>[]} params.columns - Array of column definitions from react-table
 * @param {string[]} params.priorityColumnIds - Array of column IDs to display first (optional)
 * @param {number} params.width - Current screen width
 * @returns {string[] | undefined} Array of column IDs in display order, or undefined if conditions not met
 */
export const getNewColumnOrder = function <T>({
  breakpoint,
  columns,
  priorityColumnIds = [],
  width,
}: {
  breakpoint: number
  columns: ColumnDef<T>[]
  priorityColumnIds?: string[]
  width: number
}) {
  if (width >= breakpoint || priorityColumnIds.length === 0) {
    return undefined
  }
  return [
    ...priorityColumnIds,
    ...columns
      .filter(c => c.id)
      .map(c => c.id!)
      .filter(id => id && !priorityColumnIds.includes(id)),
  ]
}
