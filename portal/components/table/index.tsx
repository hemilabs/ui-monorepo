'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useWindowSize } from 'hooks/useWindowSize'
import { useRef } from 'react'
import Skeleton from 'react-loading-skeleton'

import { useInfiniteScroll } from './_hooks/useInfiniteScroll'
import { useScrollbarDetection } from './_hooks/useScrollbarDetection'
import { useTableData } from './_hooks/useTableData'
import { Column, ColumnHeader } from './table'

export type TableProps<T> = {
  columns: ColumnDef<T, unknown>[]
  data?: T[]
  getRowKey?: (row: T, index: number) => string
  hasMore?: boolean
  loading?: boolean
  loadingMore?: boolean
  onLoadMore?: VoidFunction
  priorityColumnIdsOnSmall?: string[]
  skeletonRows?: number
  smallBreakpoint?: number
}

export function Table<T>({
  columns,
  data = [],
  getRowKey,
  hasMore = false,
  loading = false,
  loadingMore = false,
  onLoadMore,
  priorityColumnIdsOnSmall,
  skeletonRows = 4,
  smallBreakpoint = 1024,
}: TableProps<T>) {
  const loadMoreRef = useRef<HTMLTableRowElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { height, width } = useWindowSize()

  const hasVerticalBodyScrollbar = useScrollbarDetection({
    data,
    height,
    ref: scrollContainerRef,
  })

  useInfiniteScroll({
    hasMore,
    loadingMore,
    onLoadMore,
    ref: loadMoreRef,
  })

  const { columnOrder, columnsWithSkeleton, safeData } = useTableData({
    columns,
    data,
    loading,
    priorityColumnIdsOnSmall,
    skeletonRows,
    smallBreakpoint,
    width,
  })

  const table = useReactTable({
    columns: columnsWithSkeleton,
    data: safeData,
    getCoreRowModel: getCoreRowModel(),
    state: { columnOrder },
  })

  const { rows } = table.getRowModel()

  return (
    <div
      className="flex size-full flex-col rounded-xl bg-neutral-50 text-sm font-medium"
      style={{
        scrollbarColor: '#d4d4d4 transparent',
        scrollbarWidth: 'thin',
      }}
    >
      <div className="flex h-full flex-col overflow-x-auto">
        <div className="flex h-full min-w-max flex-col">
          <div className="px-1">
            {/* Header */}
            <div
              className={`rounded-t-xl bg-neutral-100 pb-1.5 ${
                hasVerticalBodyScrollbar && width >= smallBreakpoint
                  ? 'pr-3'
                  : ''
              }`}
            >
              {table.getHeaderGroups().map(headerGroup => (
                <div className="flex w-full items-center" key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <ColumnHeader
                      className={
                        header.column.columnDef.meta?.className ??
                        'justify-start'
                      }
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
                </div>
              ))}
            </div>
          </div>
          {/* Body */}
          <div
            className="shadow-table mx-1 -mt-1.5 mb-1 min-h-0 flex-1 overflow-y-auto rounded-xl bg-white"
            ref={scrollContainerRef}
          >
            <table className="w-full border-separate border-spacing-0 whitespace-nowrap">
              <tbody className="relative">
                {rows.map((row, idx) => (
                  <tr
                    className="group/row flex items-center"
                    key={getRowKey ? getRowKey(row.original, idx) : row.id}
                  >
                    {row.getVisibleCells().map(cell => (
                      <Column
                        className={
                          cell.column.columnDef.meta?.className ??
                          'justify-start'
                        }
                        key={cell.id}
                        style={{
                          width: cell.column.columnDef.meta?.width,
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </Column>
                    ))}
                  </tr>
                ))}
                {hasMore && (
                  <tr
                    className="group/row flex h-16 items-center"
                    ref={loadMoreRef}
                  >
                    {loadingMore &&
                      table.getVisibleLeafColumns().map(column => (
                        <Column
                          className={
                            column.columnDef.meta?.className ?? 'justify-start'
                          }
                          key={column.id}
                          style={{ width: column.columnDef.meta?.width }}
                        >
                          <Skeleton className="w-16" />
                        </Column>
                      ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
