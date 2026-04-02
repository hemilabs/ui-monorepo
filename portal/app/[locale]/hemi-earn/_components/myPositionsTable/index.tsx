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
import { useTranslations } from 'next-intl'
import { screenBreakpoints } from 'styles'

import { useEarnPositions } from '../../_hooks/useEarnPositions'
import { TotalYieldEarnedIcon } from '../../_icons/totalYieldEarnedIcon'

import { useGetPositionsColumns } from './columns'

const NoPositionsEmptyState = function () {
  const t = useTranslations('hemi-earn.table')

  return (
    <div className="flex min-h-40 w-full flex-col items-center justify-center gap-y-2">
      <div className="flex size-8 items-center justify-center rounded-full border border-orange-100 bg-orange-50">
        <TotalYieldEarnedIcon />
      </div>
      <div className="flex flex-col items-center gap-y-1 text-center">
        <p className="text-mid-md font-semibold tracking-tight text-neutral-950">
          {t('no-positions-title')}
        </p>
        <p className="text-sm text-neutral-500">{t('no-positions-subtitle')}</p>
      </div>
    </div>
  )
}

export const MyPositionsTable = function () {
  const columns = useGetPositionsColumns()
  const positions = useEarnPositions()
  const { width } = useWindowSize()

  const table = useReactTable({
    columns,
    data: positions,
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

  const tableHead = (
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
              {flexRender(header.column.columnDef.header, header.getContext())}
            </ColumnHeader>
          ))}
        </tr>
      ))}
    </thead>
  )

  if (positions.length === 0) {
    return (
      <div className="w-full overflow-hidden rounded-xl bg-neutral-100 text-sm font-medium">
        <table className="w-full border-separate border-spacing-0 px-1">
          {tableHead}
        </table>
        <div className="mx-1 -mt-1.5 mb-1 rounded-xl bg-white shadow-md">
          <NoPositionsEmptyState />
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
        {tableHead}
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
