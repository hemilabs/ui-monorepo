'use client'

import { useWindowSize } from '@hemilabs/react-hooks/useWindowSize'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  ComponentProps,
  ComponentType,
  ReactNode,
  RefObject,
  useRef,
} from 'react'
import { screenBreakpoints } from 'styles'

import { Column } from './_components/column'
import { ColumnHeader } from './_components/columnHeader'
import { LoadingMoreIndicator } from './_components/loadingMoreIndicator'
import { LoadingSkeletonRows } from './_components/loadingSkeletonRows'
import { StaticRows } from './_components/staticRows'
import { TableBodyContainer } from './_components/tableBodyContainer'
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
  CellComponent: ComponentType<ComponentProps<'td'>>
  fetchMoreOnBottomReached: (el?: HTMLDivElement | null) => void
  isFetching: boolean
  loading: boolean
  onRowClick?: (row: TData) => void
  onRowHover?: (index: number | null) => void
  placeholder?: ReactNode
  rowSize: number
  rowVirtualizer: ReturnType<typeof useTableVirtualizer<TData>>
  scrollContainerRef: RefObject<HTMLDivElement | null>
  skeletonRows: number
  table: ReturnType<typeof useReactTable<TData>>
}

function TableBody<TData>({
  CellComponent,
  fetchMoreOnBottomReached,
  isFetching,
  loading,
  onRowClick,
  onRowHover,
  placeholder,
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
    <TableBodyContainer
      onScroll={e => fetchMoreOnBottomReached(e.currentTarget)}
      ref={scrollContainerRef}
      style={{
        scrollbarColor: '#d4d4d4 transparent',
        scrollbarWidth: 'thin',
      }}
    >
      {!placeholder ? (
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
              CellComponent={CellComponent}
              loading={loading}
              onRowClick={onRowClick}
              onRowHover={onRowHover}
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
      ) : (
        placeholder
      )}
    </TableBodyContainer>
  )
}

type StaticTableBodyProps<TData> = {
  CellComponent: ComponentType<ComponentProps<'td'>>
  loading: boolean
  onRowClick?: (row: TData) => void
  onRowHover?: (index: number | null) => void
  placeholder?: ReactNode
  skeletonRows: number
  table: ReturnType<typeof useReactTable<TData>>
}

function StaticTableBody<TData>({
  CellComponent,
  loading,
  onRowClick,
  onRowHover,
  placeholder,
  skeletonRows,
  table,
}: StaticTableBodyProps<TData>) {
  const { rows } = table.getRowModel()

  return (
    <div className="-mt-1.5 mb-1 overflow-hidden rounded-xl bg-white shadow-md">
      {!placeholder ? (
        <table className="w-full border-separate border-spacing-0 whitespace-nowrap">
          <tbody>
            <LoadingSkeletonRows
              loading={loading}
              rows={rows}
              skeletonRows={skeletonRows}
              table={table}
            />
            <StaticRows
              CellComponent={CellComponent}
              loading={loading}
              onRowClick={onRowClick}
              onRowHover={onRowHover}
              rows={rows}
            />
          </tbody>
        </table>
      ) : (
        placeholder
      )}
    </div>
  )
}

export type TableProps<TData> = {
  cellComponent?: ComponentType<ComponentProps<'td'>>
  columns: ColumnDef<TData>[]
  data: TData[] | undefined
  fetchNextPage?: VoidFunction
  hasNextPage?: boolean
  isFetching?: boolean
  loading?: boolean
  mode?: 'static' | 'virtual'
  onRowClick?: (row: TData) => void
  onRowHover?: (index: number | null) => void
  placeholder?: ReactNode
  priorityColumnIdsOnSmall?: string[]
  rowSize?: number
  skeletonRows?: number
  smallBreakpoint?: number
}

export function Table<TData>({
  cellComponent: CellComponent = Column,
  columns,
  data = [],
  fetchNextPage,
  hasNextPage = false,
  isFetching = false,
  loading = false,
  mode = 'virtual',
  onRowClick,
  onRowHover,
  placeholder,
  priorityColumnIdsOnSmall,
  rowSize = 64,
  skeletonRows = 4,
  smallBreakpoint = screenBreakpoints.lg,
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

  const isVirtual = mode === 'virtual'
  const heightClass = isVirtual ? ' h-full' : ''

  return (
    <div className={`flex flex-col${heightClass}`}>
      <div
        className={`flex flex-col overflow-x-auto${heightClass}`}
        style={{
          scrollbarColor: '#d4d4d4 transparent',
          scrollbarWidth: 'thin',
        }}
      >
        <div className={`flex min-w-max flex-col px-1${heightClass}`}>
          <TableHeader
            hasVerticalBodyScrollbar={hasVerticalBodyScrollbar}
            smallBreakpoint={smallBreakpoint}
            table={table}
            width={width}
          />
          {isVirtual ? (
            <TableBody
              CellComponent={CellComponent}
              fetchMoreOnBottomReached={fetchMoreOnBottomReached}
              isFetching={isFetching}
              loading={loading}
              onRowClick={onRowClick}
              onRowHover={onRowHover}
              placeholder={placeholder}
              rowSize={rowSize}
              rowVirtualizer={rowVirtualizer}
              scrollContainerRef={scrollContainerRef}
              skeletonRows={skeletonRows}
              table={table}
              virtualItems={virtualItems}
            />
          ) : (
            <StaticTableBody
              CellComponent={CellComponent}
              loading={loading}
              onRowClick={onRowClick}
              onRowHover={onRowHover}
              placeholder={placeholder}
              skeletonRows={skeletonRows}
              table={table}
            />
          )}
        </div>
      </div>
    </div>
  )
}
