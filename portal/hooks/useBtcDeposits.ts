import { useMemo } from 'react'
import { isBtcDeposit } from 'utils/tunnel'

import { useDeposits } from './useDeposits'

export const useBtcDeposits = function () {
  const deposits = useDeposits()
  return useMemo(() => deposits.filter(isBtcDeposit), [deposits])
}
