import { RefObject, useEffect, useState } from 'react'

type Props<TData> = {
  data: TData[] | undefined
  height: number
  ref: RefObject<HTMLDivElement | null>
}

export function useScrollbarDetection<TData>({
  data,
  height,
  ref,
}: Props<TData>) {
  const [hasScrollbar, setHasScrollbar] = useState(false)

  useEffect(
    function detectScrollbar() {
      if (ref.current) {
        // Only when the scrollbar takes up width: overlay scrollbars (macOS)
        // leave the body full width, so compensating the header would misalign it.
        const scrollbarWidth = ref.current.offsetWidth - ref.current.clientWidth
        setHasScrollbar(scrollbarWidth > 0)
      }
    },
    [data, height, ref],
  )

  return hasScrollbar
}
