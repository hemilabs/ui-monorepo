import { Table } from 'components/table'
import { ComponentProps } from 'react'
import Skeleton from 'react-loading-skeleton'

import {
  type CompositionItemWithColor,
  useGetCompositionColumns,
} from './compositionColumns'

// Not the shared `Column`: this table's rows are shorter than the 56px it
// enforces with `min-h-14`, so it defines the cell chrome on its own.
const CompositionCell = ({ className, ...props }: ComponentProps<'td'>) => (
  <td
    className={`flex size-full flex-grow cursor-pointer items-center border-b border-solid border-neutral-100 py-3 first:pl-4 last:pr-4 group-hover/row:bg-neutral-50 ${
      className ?? ''
    }`}
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
      <div className="w-full text-sm font-medium">
        <div className="h-12 rounded-t-lg bg-neutral-100 pb-1.5 shadow-bs" />
        <div className="-mt-1.5 mb-1 overflow-hidden rounded-lg bg-white shadow-sm">
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
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full text-sm font-medium">
      <Table
        cellComponent={CompositionCell}
        columns={columns}
        containerClassName="flex flex-col"
        data={data}
        mode="static"
        onRowHover={onHoveredIndexChange}
      />
    </div>
  )
}
