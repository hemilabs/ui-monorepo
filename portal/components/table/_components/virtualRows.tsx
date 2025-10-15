import { flexRender, Row } from '@tanstack/react-table'
import type { VirtualItem } from '@tanstack/react-virtual'

import { Column } from './column'

type Props<TData> = {
  loading: boolean
  onRowClick?: (row: TData) => void
  rows: Row<TData>[]
  virtualItems: VirtualItem[]
}

export function VirtualRows<TData>({
  loading,
  onRowClick,
  rows,
  virtualItems,
}: Props<TData>) {
  if (loading && rows.length === 0) {
    return null
  }

  return (
    <>
      {virtualItems.map(function (virtualRow) {
        const row = rows[virtualRow.index]
        return (
          <tr
            className="group/row absolute flex w-full items-center"
            data-index={virtualRow.index}
            key={row.id}
            onClick={() => onRowClick?.(row.original)}
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {row.getVisibleCells().map(cell => (
              <Column
                className={
                  cell.column.columnDef.meta?.className ?? 'justify-start'
                }
                key={cell.id}
                style={{
                  width: cell.column.columnDef.meta?.width,
                }}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </Column>
            ))}
          </tr>
        )
      })}
    </>
  )
}
