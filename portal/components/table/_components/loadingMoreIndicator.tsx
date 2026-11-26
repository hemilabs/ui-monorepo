import type { Table } from '@tanstack/react-table'
import { Virtualizer } from '@tanstack/react-virtual'
import type { ComponentProps, ComponentType } from 'react'
import Skeleton from 'react-loading-skeleton'

import { Column } from './column'

type Props<TData> = {
  CellComponent?: ComponentType<ComponentProps<'td'>>
  isFetching: boolean
  loading: boolean
  rowSize: number
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>
  table: Table<TData>
}

export function LoadingMoreIndicator<TData>({
  CellComponent = Column,
  isFetching,
  loading,
  rowSize,
  rowVirtualizer,
  table,
}: Props<TData>) {
  if (!isFetching || loading) {
    return null
  }

  return (
    <tr
      className="group/row absolute flex w-full items-center"
      style={{
        height: `${rowSize}px`,
        transform: `translateY(${rowVirtualizer.getTotalSize()}px)`,
      }}
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
  )
}
