import { useCallback, useState } from 'react'
import { sanitizeAmount } from 'utils/form'

export const useAmount = function () {
  const [amount, setAmount] = useState('0')

  const onChange = useCallback(function (input: string) {
    const result = sanitizeAmount(input)
    if (!('error' in result)) {
      setAmount(result.value)
    }
  }, [])

  return [amount, onChange] as const
}
