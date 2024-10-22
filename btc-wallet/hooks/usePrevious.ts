import { useRef } from 'react'

export const usePrevious = function <TValue>(
  value: TValue,
  isEqualFunc: (prev: TValue, next: TValue) => boolean,
) {
  const ref = useRef<{ prev: TValue | null; value: TValue | null }>({
    prev: null,
    value,
  })

  const current = ref.current.value

  if (!isEqualFunc(current, value)) {
    ref.current = {
      prev: current,
      value,
    }
  }

  return ref.current.prev
}
