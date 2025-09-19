import { useCallback, useEffect, RefObject } from 'react'

type UseInfiniteScrollProps = {
  fetchNextPage?: VoidFunction
  hasNextPage: boolean
  isFetching: boolean
  scrollContainerRef: RefObject<HTMLDivElement | null>
}

export function useInfiniteScroll({
  fetchNextPage,
  hasNextPage,
  isFetching,
  scrollContainerRef,
}: UseInfiniteScrollProps) {
  const fetchMoreOnBottomReached = useCallback(
    function (containerRefElement?: HTMLDivElement | null) {
      if (containerRefElement && fetchNextPage) {
        const { clientHeight, scrollHeight, scrollTop } = containerRefElement
        // Fetch more when user scrolls within 500px of bottom
        if (
          scrollHeight - scrollTop - clientHeight < 500 &&
          !isFetching &&
          hasNextPage
        ) {
          fetchNextPage()
        }
      }
    },
    [fetchNextPage, isFetching, hasNextPage],
  )

  // Check on mount and after fetch if we need more data
  useEffect(
    function fetchMoreData() {
      fetchMoreOnBottomReached(scrollContainerRef.current)
    },
    [fetchMoreOnBottomReached, scrollContainerRef],
  )

  return { fetchMoreOnBottomReached }
}
