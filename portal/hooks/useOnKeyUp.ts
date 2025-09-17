import { useRef, useEffect, RefObject } from 'react'

export const useOnKeyUp = function <T extends HTMLElement>(
  handler: (e: KeyboardEvent) => void,
  initialRef?: RefObject<T | null>,
) {
  const internalRef = useRef<T>(null)
  const ref = initialRef ?? internalRef

  useEffect(
    function () {
      document.addEventListener('keyup', handler)
      return function () {
        document.removeEventListener('keyup', handler)
      }
    },
    [ref, handler],
  )

  return ref
}
