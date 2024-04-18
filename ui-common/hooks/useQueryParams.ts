'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'

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

      const search = urlSearchParams.toString()
      const query = search.length > 0 ? `?${search}` : ''

      router.push(`${pathname}${query}`)
    },
    [pathname, router, urlSearchParams],
  )

  const removeQueryParams = useCallback(
    function (toRemove: string[] | string) {
      const newSearchParams = new URLSearchParams()
      const keysToRemove = [].concat(toRemove)
      Array.from(urlSearchParams.entries()).forEach(function ([key, value]) {
        if (!keysToRemove.includes(key)) {
          newSearchParams.set(key, value)
        }
      })
      const search = newSearchParams.toString()
      const query = search.length > 0 ? `?${search}` : ''

      router.push(`${pathname}${query}`)
    },
    [pathname, router, urlSearchParams],
  )

  return { queryParams, removeQueryParams, setQueryParams }
}
