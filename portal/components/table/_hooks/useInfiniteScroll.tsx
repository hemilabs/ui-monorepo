import { RefObject, useEffect } from 'react'

type Props = {
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: VoidFunction
  ref: RefObject<HTMLElement | null>
}

export function useInfiniteScroll({
  hasMore,
  loadingMore,
  onLoadMore,
  ref,
}: Props) {
  useEffect(
    function observeIntersection() {
      if (!onLoadMore || !hasMore || loadingMore) {
        return undefined
      }

      const observer = new IntersectionObserver(
        function (entries) {
          if (entries[0].isIntersecting) {
            onLoadMore()
          }
        },
        { threshold: 0.1 },
      )

      if (ref.current) {
        observer.observe(ref.current)
      }

      return function cleanup() {
        observer.disconnect()
      }
    },
    [ref, onLoadMore, hasMore, loadingMore],
  )
}
