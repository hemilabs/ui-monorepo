'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'

const updateRoute = function ({
  pathname,
  router,
  urlSearchParams,
}: {
  pathname: string
  router: ReturnType<typeof useRouter>
  urlSearchParams: URLSearchParams
}) {
  const search = urlSearchParams.toString()
  const query = search.length > 0 ? `?${search}` : ''

  router.push(`${pathname}${query}`)
}

export const useQueryParams = function <T = Record<string, string>>() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryParams = Object.fromEntries(searchParams.entries()) as Partial<T>
  const searchParamsString = searchParams.toString()
  const urlSearchParams = useMemo(
    () => new URLSearchParams(searchParamsString),
    [searchParamsString],
  )

  const setQueryParams = useCallback(
    function (params: Partial<T>) {
      Object.entries(params).forEach(function ([key, value]) {
        urlSearchParams.set(key, String(value))
      })

      updateRoute({
        pathname,
        router,
        urlSearchParams,
      })
    },
    [pathname, router, urlSearchParams],
  )

  const removeQueryParams = useCallback(
    function (toRemove: string[] | string) {
      const newSearchParams = new URLSearchParams()
      const keysToRemove = Array.isArray(toRemove) ? toRemove : [toRemove]
      Array.from(urlSearchParams.entries()).forEach(function ([key, value]) {
        if (!keysToRemove.includes(key)) {
          newSearchParams.set(key, value)
        }
      })
      updateRoute({
        pathname,
        router,
        urlSearchParams: newSearchParams,
      })
    },
    [pathname, router, urlSearchParams],
  )

  return { queryParams, removeQueryParams, setQueryParams }
}
