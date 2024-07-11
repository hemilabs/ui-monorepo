import { TunnelHistoryContext } from 'context/tunnelHistoryContext'
import { useContext, useMemo } from 'react'
import { isBtcDeposit } from 'utils/tunnel'

export const useBtcDeposits = function () {
  const { deposits } = useContext(TunnelHistoryContext)
  return useMemo(() => deposits.filter(isBtcDeposit), [deposits])
}
