'use client'

import { Table } from 'components/table'
import { ComponentProps } from 'react'
import Skeleton from 'react-loading-skeleton'

import {
  type CompositionItemWithColor,
  useGetCompositionColumns,
} from './compositionColumns'

const CompositionCell = ({ className, ...props }: ComponentProps<'td'>) => (
  <td
    className={`flex size-full flex-grow cursor-pointer items-center border-b border-solid border-neutral-100 py-3 group-hover/row:bg-neutral-50 first:[&>*]:pl-4 last:[&>*]:pr-4 ${className}`}
    {...props}
  />
)

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
    <div className="w-full rounded-xl bg-neutral-100 text-sm font-medium">
      <Table
        cellComponent={CompositionCell}
        columns={columns}
        data={data}
        mode="static"
        onRowHover={onHoveredIndexChange}
      />
    </div>
  )
}
