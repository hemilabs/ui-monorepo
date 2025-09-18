import { Row, useReactTable } from '@tanstack/react-table'
import Skeleton from 'react-loading-skeleton'

import { Column } from './column'

type Props<TData> = {
  loading: boolean
  rows: Row<TData>[]
  skeletonRows: number
  table: ReturnType<typeof useReactTable<TData>>
}

export function LoadingSkeletonRows<TData>({
  loading,
  rows,
  skeletonRows,
  table,
}: Props<TData>) {
  if (!loading || rows.length > 0) {
    return null
  }

  return (
    <>
      {Array.from(Array(skeletonRows).keys()).map(index => (
        <tr className="flex items-center" key={`skeleton-${index}`}>
          {table.getVisibleLeafColumns().map(column => (
            <Column
              className={column.columnDef.meta?.className ?? 'justify-start'}
              key={column.id}
              style={{ width: column.columnDef.meta?.width }}
            >
              <Skeleton className="w-16" />
            </Column>
          ))}
        </tr>
      ))}
    </>
  )
}
