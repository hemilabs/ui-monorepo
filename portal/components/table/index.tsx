'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useWindowSize } from 'hooks/useWindowSize'
import { RefObject, useRef } from 'react'

import { ColumnHeader } from './_components/columnHeader'
import { LoadingMoreIndicator } from './_components/loadingMoreIndicator'
import { LoadingSkeletonRows } from './_components/loadingSkeletonRows'
import { VirtualRows } from './_components/virtualRows'
import { useInfiniteScroll } from './_hooks/useInfiniteScroll'
import { useScrollbarDetection } from './_hooks/useScrollbarDetection'
import { useTableData } from './_hooks/useTableData'
import { useTableVirtualizer } from './_hooks/useTableVirtualizer'

type TableHeaderProps<TData> = {
  hasVerticalBodyScrollbar: boolean
  smallBreakpoint: number
  table: ReturnType<typeof useReactTable<TData>>
  width: number
}

const TableHeader = <TData,>({
  hasVerticalBodyScrollbar,
  smallBreakpoint,
  table,
  width,
}: TableHeaderProps<TData>) => (
  <div
    className={`rounded-t-xl bg-neutral-100 pb-1.5 ${
      hasVerticalBodyScrollbar && width >= smallBreakpoint ? 'pr-2.5' : ''
    }`}
  >
    <table className="w-full border-separate border-spacing-0 whitespace-nowrap">
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr className="flex w-full items-center" key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <ColumnHeader
                className={
                  header.column.columnDef.meta?.className ?? 'justify-start'
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
          </tr>
        ))}
      </thead>
    </table>
  </div>
)

type TableBodyProps<TData> = {
  fetchMoreOnBottomReached: (el?: HTMLDivElement | null) => void
  isFetching: boolean
  loading: boolean
  rowSize: number
  rowVirtualizer: ReturnType<typeof useTableVirtualizer<TData>>
  scrollContainerRef: RefObject<HTMLDivElement | null>
  skeletonRows: number
  table: ReturnType<typeof useReactTable<TData>>
}

function TableBody<TData>({
  fetchMoreOnBottomReached,
  isFetching,
  loading,
  rowSize,
  rowVirtualizer,
  scrollContainerRef,
  skeletonRows,
  table,
  virtualItems,
}: TableBodyProps<TData> & {
  virtualItems: ReturnType<typeof rowVirtualizer.getVirtualItems>
}) {
  const { rows } = table.getRowModel()

  return (
    <div
      className="-mt-1.5 mb-1 min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-xl bg-white shadow-md"
      onScroll={e => fetchMoreOnBottomReached(e.currentTarget)}
      ref={scrollContainerRef}
      style={{
        scrollbarColor: '#d4d4d4 transparent',
        scrollbarWidth: 'thin',
      }}
    >
      <table className="w-full border-separate border-spacing-0 whitespace-nowrap">
        <tbody
          className="relative"
          style={{
            height: `${
              rowVirtualizer.getTotalSize() +
              (isFetching && !loading ? rowSize : 0)
            }px`,
          }}
        >
          <LoadingSkeletonRows
            loading={loading}
            rows={rows}
            skeletonRows={skeletonRows}
            table={table}
          />
          <VirtualRows
            loading={loading}
            rows={rows}
            virtualItems={virtualItems}
          />
          <LoadingMoreIndicator
            isFetching={isFetching}
            loading={loading}
            rowSize={rowSize}
            rowVirtualizer={rowVirtualizer}
            table={table}
          />
        </tbody>
      </table>
    </div>
  )
}

export type TableProps<TData> = {
  columns: ColumnDef<TData>[]
  data: TData[] | undefined
  fetchNextPage?: VoidFunction
  hasNextPage?: boolean
  isFetching?: boolean
  loading?: boolean
  priorityColumnIdsOnSmall?: string[]
  rowSize?: number
  skeletonRows?: number
  smallBreakpoint?: number
}

export function Table<TData>({
  columns,
  data = [],
  fetchNextPage,
  hasNextPage = false,
  isFetching = false,
  loading = false,
  priorityColumnIdsOnSmall,
  rowSize = 64,
  skeletonRows = 4,
  smallBreakpoint = 1024,
}: TableProps<TData>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { height, width } = useWindowSize()

  const hasVerticalBodyScrollbar = useScrollbarDetection({
    data,
    height,
    ref: scrollContainerRef,
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

  const { fetchMoreOnBottomReached } = useInfiniteScroll({
    fetchNextPage,
    hasNextPage,
    isFetching,
    scrollContainerRef,
  })

  const rowVirtualizer = useTableVirtualizer({
    rows,
    rowSize,
    scrollContainerRef,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  return (
    <div className="flex h-full flex-col bg-neutral-50">
      <div
        className="flex h-full flex-col overflow-x-auto"
        style={{
          scrollbarColor: '#d4d4d4 transparent',
          scrollbarWidth: 'thin',
        }}
      >
        <div className="flex h-full min-w-max flex-col px-1">
          <TableHeader
            hasVerticalBodyScrollbar={hasVerticalBodyScrollbar}
            smallBreakpoint={smallBreakpoint}
            table={table}
            width={width}
          />
          <TableBody
            fetchMoreOnBottomReached={fetchMoreOnBottomReached}
            isFetching={isFetching}
            loading={loading}
            rowSize={rowSize}
            rowVirtualizer={rowVirtualizer}
            scrollContainerRef={scrollContainerRef}
            skeletonRows={skeletonRows}
            table={table}
            virtualItems={virtualItems}
          />
        </div>
      </div>
    </div>
  )
}
