'use client'

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ColumnHeader } from 'components/table/_components/columnHeader'
import Skeleton from 'react-loading-skeleton'

import {
  type CompositionItemWithColor,
  useGetCompositionColumns,
} from './compositionColumns'

type Props = {
  data: CompositionItemWithColor[]
  isPending: boolean
  onHoveredIndexChange: (index: number | null) => void
}

export const CompositionTable = function ({
  data,
  isPending,
  onHoveredIndexChange,
}: Props) {
  const columns = useGetCompositionColumns()

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isPending) {
    return (
      <div className="w-full overflow-hidden rounded-xl bg-neutral-100 text-sm font-medium">
        <div className="h-10" />
        <div className="rounded-xl bg-white shadow-md">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              className="flex items-center border-x border-b border-neutral-100 px-4 py-3"
              key={i}
            >
              <div className="flex flex-1 items-center gap-2">
                <Skeleton className="h-3 w-1" />
                <Skeleton className="w-20" />
              </div>
              <Skeleton className="w-12" />
              <Skeleton className="ml-4 w-10" />
              <Skeleton className="ml-4 w-10" />
            </div>
          ))}
        </div>
      </div>
    )
  }

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
                  className={header.column.columnDef.meta?.className}
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
            <tr
              className="group/row flex w-full items-center"
              key={row.id}
              onMouseEnter={() => onHoveredIndexChange(row.index)}
              onMouseLeave={() => onHoveredIndexChange(null)}
            >
              {row.getVisibleCells().map(cell => (
                <td
                  className={`flex size-full flex-grow cursor-pointer items-center border-b border-solid border-neutral-100 py-3 group-hover/row:bg-neutral-50 first:[&>*]:pl-4 last:[&>*]:pr-4 ${
                    cell.column.columnDef.meta?.className ?? ''
                  }`}
                  key={cell.id}
                  style={{
                    width: cell.column.columnDef.meta?.width,
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
