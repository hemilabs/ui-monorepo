import { useCallback, useState } from 'react'
import { sanitizeAmount } from 'utils/form'

export const useAmount = function () {
  const [amount, setAmount] = useState('0')

  const onChange = useCallback(function (input: string) {
    const { error, value } = sanitizeAmount(input)
    if (!error) {
      setAmount(value)
    }
  }, [])

  return [amount, onChange] as const
}
