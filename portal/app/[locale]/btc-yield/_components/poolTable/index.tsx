import {
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Column } from 'components/table/_components/column'
import { ColumnHeader } from 'components/table/_components/columnHeader'
import { getNewColumnOrder } from 'components/table/_utils'
import { useWindowSize } from 'hooks/useWindowSize'
import { Fragment, useState } from 'react'

import { useTableData } from '../../_hooks/useTableData'

import { useGetColumns } from './columns'
import { StrategiesRow } from './strategiesRow'

export const PoolTable = function () {
  const columns = useGetColumns()
  const { data } = useTableData()
  const { width } = useWindowSize()

  const [expanded, setExpanded] = useState<ExpandedState>({})

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: row =>
      row.original.strategies !== undefined &&
      row.original.strategies.length > 0,
    onExpandedChange: setExpanded,
    state: {
      columnOrder: getNewColumnOrder({
        breakpoint: 1024,
        columns,
        priorityColumnIds: ['actions'],
        width,
      }),
      expanded,
    },
  })

  return (
    <div
      className="mt-8 w-full overflow-x-auto rounded-xl bg-neutral-100 text-sm font-medium"
      style={{
        scrollbarColor: '#d4d4d4 transparent',
        scrollbarWidth: 'thin',
      }}
    >
      <table className="w-full border-separate border-spacing-0 whitespace-nowrap px-1">
        <thead className="sticky top-0 z-10">
          {table.getHeaderGroups().map(headerGroup => (
            <tr className="flex w-full items-center" key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <ColumnHeader
                  key={header.id}
                  style={{
                    width: header.column.columnDef.meta?.width,
                  }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </ColumnHeader>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="-mt-1.5 mb-1 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-xl bg-white shadow-md">
          {table.getRowModel().rows.map(row => (
            <Fragment key={row.id}>
              <tr
                className="flex w-full items-center [&>td]:border-b-0"
                onClick={row.getToggleExpandedHandler()}
              >
                {row.getVisibleCells().map(cell => (
                  <Column
                    key={cell.id}
                    style={{
                      width: cell.column.columnDef.meta?.width,
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Column>
                ))}
              </tr>
              {row.getIsExpanded() && row.original.strategies !== undefined && (
                <tr className="flex w-full items-center">
                  <Column colSpan={row.getAllCells().length}>
                    <StrategiesRow strategies={row.original.strategies} />
                  </Column>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
