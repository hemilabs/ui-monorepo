import type { Table } from '@tanstack/react-table'
import { Virtualizer } from '@tanstack/react-virtual'
import Skeleton from 'react-loading-skeleton'

import { Column } from './column'

type Props<TData> = {
  isFetching: boolean
  loading: boolean
  rowSize: number
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>
  table: Table<TData>
}

export function LoadingMoreIndicator<TData>({
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
        <Column
          className={column.columnDef.meta?.className ?? 'justify-start'}
          key={column.id}
          style={{ width: column.columnDef.meta?.width }}
        >
          <Skeleton className="w-16" />
        </Column>
      ))}
    </tr>
  )
}
