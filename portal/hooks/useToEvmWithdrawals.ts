import { useMemo } from 'react'
import { isToEvmWithdraw } from 'utils/tunnel'

import { useWithdrawals } from './useWithdrawals'

export const useToEvmWithdrawals = function () {
  const withdrawals = useWithdrawals()
  return useMemo(() => withdrawals.filter(isToEvmWithdraw), [withdrawals])
}
