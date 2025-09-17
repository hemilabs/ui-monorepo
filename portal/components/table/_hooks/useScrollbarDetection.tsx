import { RefObject, useEffect, useState } from 'react'

type Props<T> = {
  data: T[] | undefined
  height: number
  ref: RefObject<HTMLDivElement | null>
}

export function useScrollbarDetection<T>({ data, height, ref }: Props<T>) {
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
