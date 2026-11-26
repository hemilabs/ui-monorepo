import { flexRender, Row } from '@tanstack/react-table'
import { ComponentProps, ComponentType } from 'react'

import { Column } from './column'

const baseRowClassName = 'group/row flex w-full items-center'

type Props<TData> = {
  CellComponent?: ComponentType<ComponentProps<'td'>>
  onRowClick?: (row: TData) => void
  onRowHover?: (index: number | null) => void
  rows: Row<TData>[]
}

export const StaticRows = <TData,>({
  CellComponent = Column,
  onRowClick,
  onRowHover,
  rows,
}: Props<TData>) => (
  <>
    {rows.map(row => (
      <tr
        className={baseRowClassName}
        key={row.id}
        onClick={onRowClick ? () => onRowClick(row.original) : undefined}
        onMouseEnter={onRowHover ? () => onRowHover(row.index) : undefined}
        onMouseLeave={onRowHover ? () => onRowHover(null) : undefined}
      >
        {row.getVisibleCells().map(cell => (
          <CellComponent
            className={cell.column.columnDef.meta?.className ?? 'justify-start'}
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
