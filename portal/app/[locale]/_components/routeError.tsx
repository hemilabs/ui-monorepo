import { LocalizedError500 } from 'components/error500'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

type Props = {
  reset: VoidFunction
}

// Recovers when the user navigates away, which keying the boundary by pathname
// would also do, but without remounting the route layouts underneath it and
// dropping the state they hold.
export const RouteError = function ({ reset }: Props) {
  const { pathname, search } = useLocation()
  const erroredAt = useRef(`${pathname}${search}`)

  useEffect(
    function resetOnNavigation() {
      if (`${pathname}${search}` !== erroredAt.current) {
        reset()
      }
    },
    [pathname, reset, search],
  )

  return <LocalizedError500 reset={reset} />
}
