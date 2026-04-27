import { flexRender, Row } from '@tanstack/react-table'
import { ComponentProps, ComponentType } from 'react'

import { Column } from './column'

type Props<TData> = {
  CellComponent?: ComponentType<ComponentProps<'td'>>
  loading: boolean
  onRowClick?: (row: TData) => void
  onRowHover?: (index: number | null) => void
  rows: Row<TData>[]
}

export function StaticRows<TData>({
  CellComponent = Column,
  loading,
  onRowClick,
  onRowHover,
  rows,
}: Props<TData>) {
  if (loading && rows.length === 0) {
    return null
  }

  return (
    <>
      {rows.map(row => (
        <tr
          className="group/row flex w-full items-center"
          key={row.id}
          onClick={onRowClick ? () => onRowClick(row.original) : undefined}
          onMouseEnter={onRowHover ? () => onRowHover(row.index) : undefined}
          onMouseLeave={onRowHover ? () => onRowHover(null) : undefined}
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
      ))}
    </>
  )
}
