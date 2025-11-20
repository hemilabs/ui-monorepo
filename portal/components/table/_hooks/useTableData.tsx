import { useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'

import { getNewColumnOrder } from '../_utils'
import { TableProps } from '../index'

type Props<TData> = Omit<
  TableProps<TData>,
  'data' | 'loading' | 'skeletonRows' | 'smallBreakpoint'
> &
  Required<
    Pick<
      TableProps<TData>,
      'data' | 'loading' | 'skeletonRows' | 'smallBreakpoint'
    >
  > & {
    width: number
  }

export function useTableData<TData>({
  columns,
  data,
  loading,
  priorityColumnIdsOnSmall,
  skeletonRows,
  smallBreakpoint,
  width,
}: Props<TData>) {
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

  const skeletonArray = useMemo(
    () => new Array(skeletonRows).fill(null),
    [skeletonRows],
  )
  const safeData = data && data.length > 0 ? data : skeletonArray

  const columnOrder = getNewColumnOrder({
    breakpoint: smallBreakpoint,
    columns: columnsWithSkeleton,
    priorityColumnIds: priorityColumnIdsOnSmall,
    width,
  })

  return { columnOrder, columnsWithSkeleton, safeData }
}
