import { DebounceSettings } from 'lodash'
import debounce from 'lodash/debounce'
import { useState, useEffect, useMemo } from 'react'

type DebounceOptions = {
  wait?: number
} & DebounceSettings

export const useDebounce = function <T>(
  value: T,
  options: DebounceOptions = {},
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  // default values - See https://lodash.com/docs/4.17.15#debounce
  const { leading = false, trailing = true, wait = 300 } = options

  const debouncedSetValue = useMemo(
    () =>
      debounce((newValue: T) => setDebouncedValue(newValue), wait, {
        leading,
        trailing,
      }),
    [leading, setDebouncedValue, trailing, wait],
  )

  useEffect(
    function updateValue() {
      debouncedSetValue(value)
    },
    [value, debouncedSetValue],
  )

  useEffect(
    // Cleanup function to cancel debounce on unmount
    () =>
      function cleanup() {
        debouncedSetValue.flush()
        debouncedSetValue.cancel()
      },
    [debouncedSetValue],
  )

  return debouncedValue
}
