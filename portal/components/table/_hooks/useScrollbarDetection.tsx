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
        const hasScroll = ref.current.scrollHeight > ref.current.clientHeight
        setHasScrollbar(hasScroll)
      }
    },
    [data, height, ref],
  )

  return hasScrollbar
}
