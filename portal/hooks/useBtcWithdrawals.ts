import { useMemo } from 'react'
import { isToBtcWithdraw } from 'utils/tunnel'

import { useWithdrawals } from './useWithdrawals'

export const useBtcWithdrawals = function () {
  const withdrawals = useWithdrawals()
  return useMemo(() => withdrawals.filter(isToBtcWithdraw), [withdrawals])
}
