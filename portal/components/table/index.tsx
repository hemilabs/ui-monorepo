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
  UIEventHandler,
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
  headerScrollRef: RefObject<HTMLDivElement | null>
  smallBreakpoint: number
  table: ReturnType<typeof useReactTable<TData>>
  tableMinWidth: number
  width: number
}

const TableHeader = <TData,>({
  hasVerticalBodyScrollbar,
  headerScrollRef,
  smallBreakpoint,
  table,
  tableMinWidth,
  width,
}: TableHeaderProps<TData>) => (
  <div
    className={`rounded-t-xl bg-neutral-100 pb-1.5 ${
      hasVerticalBodyScrollbar && width >= smallBreakpoint ? 'pr-2.5' : ''
    }`}
  >
    <div className="overflow-x-hidden" ref={headerScrollRef}>
      <table
        className="w-full border-separate border-spacing-0 whitespace-nowrap"
        style={{ minWidth: `${tableMinWidth}px` }}
      >
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
  </div>
)

type TableBodyProps<TData> = {
  CellComponent: ComponentType<ComponentProps<'td'>>
  fetchMoreOnBottomReached: (el?: HTMLDivElement | null) => void
  headerScrollRef: RefObject<HTMLDivElement | null>
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
  tableMinWidth: number
}

function TableBody<TData>({
  CellComponent,
  fetchMoreOnBottomReached,
  headerScrollRef,
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
  tableMinWidth,
  virtualItems,
}: TableBodyProps<TData> & {
  virtualItems: ReturnType<typeof rowVirtualizer.getVirtualItems>
}) {
  const { rows } = table.getRowModel()

  const handleScroll: UIEventHandler<HTMLDivElement> = function (e) {
    fetchMoreOnBottomReached(e.currentTarget)
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }

  return (
    <TableBodyContainer
      onScroll={handleScroll}
      scrollRef={scrollContainerRef}
      style={{
        scrollbarColor: '#d4d4d4 transparent',
        scrollbarWidth: 'thin',
      }}
    >
      {!placeholder ? (
        <table
          className="w-full border-separate border-spacing-0 whitespace-nowrap"
          style={{ minWidth: `${tableMinWidth}px` }}
        >
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
  headerScrollRef: RefObject<HTMLDivElement | null>
  loading: boolean
  onRowClick?: (row: TData) => void
  onRowHover?: (index: number | null) => void
  placeholder?: ReactNode
  skeletonRows: number
  table: ReturnType<typeof useReactTable<TData>>
  tableMinWidth: number
}

function StaticTableBody<TData>({
  CellComponent,
  headerScrollRef,
  loading,
  onRowClick,
  onRowHover,
  placeholder,
  skeletonRows,
  table,
  tableMinWidth,
}: StaticTableBodyProps<TData>) {
  const { rows } = table.getRowModel()

  const handleScroll: UIEventHandler<HTMLDivElement> = function (e) {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }

  return (
    <div className="-mt-1.5 mb-1 overflow-hidden rounded-xl bg-white shadow-md">
      <div
        className="overflow-x-auto"
        onScroll={handleScroll}
        style={{
          scrollbarColor: '#d4d4d4 transparent',
          scrollbarWidth: 'thin',
        }}
      >
        {!placeholder ? (
          <table
            className="w-full border-separate border-spacing-0 whitespace-nowrap"
            style={{ minWidth: `${tableMinWidth}px` }}
          >
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
  data,
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
  const headerScrollRef = useRef<HTMLDivElement>(null)
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

  const tableMinWidth = table
    .getVisibleLeafColumns()
    .reduce((sum, column) => sum + (column.columnDef.meta?.width ?? 0), 0)

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
    <div className={`flex flex-col px-1${heightClass}`}>
      <TableHeader
        hasVerticalBodyScrollbar={hasVerticalBodyScrollbar}
        headerScrollRef={headerScrollRef}
        smallBreakpoint={smallBreakpoint}
        table={table}
        tableMinWidth={tableMinWidth}
        width={width}
      />
      {isVirtual ? (
        <TableBody
          CellComponent={CellComponent}
          fetchMoreOnBottomReached={fetchMoreOnBottomReached}
          headerScrollRef={headerScrollRef}
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
          tableMinWidth={tableMinWidth}
          virtualItems={virtualItems}
        />
      ) : (
        <StaticTableBody
          CellComponent={CellComponent}
          headerScrollRef={headerScrollRef}
          loading={loading}
          onRowClick={onRowClick}
          onRowHover={onRowHover}
          placeholder={placeholder}
          skeletonRows={skeletonRows}
          table={table}
          tableMinWidth={tableMinWidth}
        />
      )}
    </div>
  )
}
