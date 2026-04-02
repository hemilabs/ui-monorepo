'use client'

import { useWindowSize } from '@hemilabs/react-hooks/useWindowSize'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Column } from 'components/table/_components/column'
import { ColumnHeader } from 'components/table/_components/columnHeader'
import { getNewColumnOrder } from 'components/table/_utils'
import { screenBreakpoints } from 'styles'

import { useEarnPools } from '../../_hooks/useEarnPools'

import { useGetPoolsColumns } from './columns'

export const PoolsTable = function () {
  const columns = useGetPoolsColumns()
  const { data: pools = [] } = useEarnPools()
  const { width } = useWindowSize()

  const table = useReactTable({
    columns,
    data: pools,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnOrder: getNewColumnOrder({
        breakpoint: screenBreakpoints.lg,
        columns,
        priorityColumnIds: ['actions'],
        width,
      }),
    },
  })

  return (
    <div
      className="w-full overflow-x-auto rounded-xl bg-neutral-100 text-sm font-medium"
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
            <tr className="group/row flex w-full items-center" key={row.id}>
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
          ))}
        </tbody>
      </table>
    </div>
  )
}
