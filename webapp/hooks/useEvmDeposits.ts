import { useMemo } from 'react'
import { isEvmDeposit } from 'utils/tunnel'

import { useDeposits } from './useDeposits'

export const useEvmDeposits = function () {
  const deposits = useDeposits()
  return useMemo(() => deposits.filter(isEvmDeposit), [deposits])
}
