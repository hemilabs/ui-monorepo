import { formatPercentage } from 'utils/format'

import { type EarnTransaction } from '../types'

export const formatApyDisplay = function (apy: number) {
  if (apy < 0.01) {
    return '< 0.01%'
  }
  return formatPercentage(apy)
}

// The terminal on-chain hash for a delivery — claim for CLAIMED, recover
// for RECOVERED. Used by the drawer's waiting-for-shares step to render
// the "Confirmed" bottom row.
export const getTerminalDeliveryTxHash = function (
  tx: EarnTransaction | undefined,
) {
  if (tx?.status === 'CLAIMED') return tx.claimTxHash ?? undefined
  if (tx?.status === 'RECOVERED') return tx.recoverTxHash ?? undefined
  return undefined
}
