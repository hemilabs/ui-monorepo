import { useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'

import { TableProps } from '../index'

type Props<T> = Omit<
  TableProps<T>,
  'data' | 'loading' | 'skeletonRows' | 'smallBreakpoint'
> &
  Required<
    Pick<TableProps<T>, 'loading' | 'skeletonRows' | 'smallBreakpoint'>
  > & {
    data: T[] | undefined
    width: number
  }

export function useTableData<T>({
  columns,
  data,
  loading,
  priorityColumnIdsOnSmall,
  skeletonRows,
  smallBreakpoint,
  width,
}: Props<T>) {
  const showSkeleton = (data?.length ?? 0) === 0 && loading

  const columnsWithSkeleton = useMemo(
    () =>
      columns.map(col =>
        showSkeleton
          ? {
              ...col,
              cell: () => <Skeleton className="w-16" />,
            }
          : col,
      ),
    [columns, showSkeleton],
  )

  const safeData =
    data && data.length > 0 ? data : new Array(skeletonRows).fill(null)

  const columnOrder =
    width < smallBreakpoint && priorityColumnIdsOnSmall?.length
      ? [
          ...priorityColumnIdsOnSmall,
          ...columnsWithSkeleton
            .map(c => c.id!)
            .filter(id => id && !priorityColumnIdsOnSmall.includes(id)),
        ]
      : undefined

  return { columnOrder, columnsWithSkeleton, safeData }
}
