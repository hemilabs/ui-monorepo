import { flexRender, Row } from '@tanstack/react-table'

import { useTableVirtualizer } from '../_hooks/useTableVirtualizer'

import { Column } from './column'

type Props<TData> = {
  getRowKey?: (row: TData, index: number) => string
  loading: boolean
  rows: Row<TData>[]
  virtualItems: ReturnType<
    ReturnType<typeof useTableVirtualizer<TData>>['getVirtualItems']
  >
}

export function VirtualRows<TData>({
  getRowKey,
  loading,
  rows,
  virtualItems,
}: Props<TData>) {
  if (loading && rows.length === 0) {
    return null
  }

  return (
    <>
      {virtualItems.map(function (virtualRow) {
        const row = rows[virtualRow.index] as Row<TData>
        return (
          <tr
            className="group/row absolute flex w-full items-center"
            data-index={virtualRow.index}
            key={getRowKey ? getRowKey(row.original, virtualRow.index) : row.id}
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
