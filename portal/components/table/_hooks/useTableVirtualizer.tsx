import { Row } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { RefObject } from 'react'

type UseTableVirtualizerProps<TData> = {
  rows: Row<TData>[]
  rowSize: number
  scrollContainerRef: RefObject<HTMLDivElement | null>
}

export function useTableVirtualizer<TData>({
  rows,
  rowSize,
  scrollContainerRef,
}: UseTableVirtualizerProps<TData>) {
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => rowSize,
    getScrollElement: () => scrollContainerRef.current,
    initialRect: {
      height: rows.length * rowSize,
      width: 0,
    },
    overscan: 10,
  })

  return rowVirtualizer
}
