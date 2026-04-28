import { flexRender, Row } from '@tanstack/react-table'
import type { VirtualItem } from '@tanstack/react-virtual'
import { ComponentProps, ComponentType } from 'react'

import { Column } from './column'

type Props<TData> = {
  CellComponent?: ComponentType<ComponentProps<'td'>>
  loading: boolean
  onRowClick?: (row: TData) => void
  onRowHover?: (index: number | null) => void
  rows: Row<TData>[]
  virtualItems: VirtualItem[]
}

export function VirtualRows<TData>({
  CellComponent = Column,
  loading,
  onRowClick,
  onRowHover,
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
            onClick={onRowClick ? () => onRowClick(row.original) : undefined}
            onMouseEnter={onRowHover ? () => onRowHover(row.index) : undefined}
            onMouseLeave={onRowHover ? () => onRowHover(null) : undefined}
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {row.getVisibleCells().map(cell => (
              <CellComponent
                className={
                  cell.column.columnDef.meta?.className ?? 'justify-start'
                }
                key={cell.id}
                style={{
                  width: cell.column.columnDef.meta?.width,
                }}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </CellComponent>
            ))}
          </tr>
        )
      })}
    </>
  )
}
