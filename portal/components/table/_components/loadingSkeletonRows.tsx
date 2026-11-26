import type { Row, Table } from '@tanstack/react-table'
import type { ComponentProps, ComponentType } from 'react'
import Skeleton from 'react-loading-skeleton'

import { Column } from './column'

type Props<TData> = {
  CellComponent?: ComponentType<ComponentProps<'td'>>
  loading: boolean
  rows: Row<TData>[]
  skeletonRows: number
  table: Table<TData>
}

export function LoadingSkeletonRows<TData>({
  CellComponent = Column,
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
        <tr
          className="flex items-center *:cursor-default"
          key={`skeleton-${index}`}
        >
          {table.getVisibleLeafColumns().map(column => (
            <CellComponent
              className={column.columnDef.meta?.className ?? 'justify-start'}
              key={column.id}
              style={{ width: column.columnDef.meta?.width }}
            >
              <Skeleton className="w-16" />
            </CellComponent>
          ))}
        </tr>
      ))}
    </>
  )
}
