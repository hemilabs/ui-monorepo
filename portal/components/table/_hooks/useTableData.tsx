import { useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'

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

  const columnOrder =
    width < smallBreakpoint && priorityColumnIdsOnSmall?.length
      ? [
          ...priorityColumnIdsOnSmall,
          ...columnsWithSkeleton
            .filter(c => c.id)
            .map(c => c.id!)
            .filter(id => id && !priorityColumnIdsOnSmall.includes(id)),
        ]
      : undefined

  return { columnOrder, columnsWithSkeleton, safeData }
}
