import { useMemo } from 'react'
import { isBtcDeposit } from 'utils/tunnel'

import { useTunnelHistory } from './useTunnelHistory'

export const useBtcDeposits = function () {
  const { deposits } = useTunnelHistory()
  return useMemo(() => deposits.filter(isBtcDeposit), [deposits])
}
