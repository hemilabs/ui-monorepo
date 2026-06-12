import { formatPercentage } from 'utils/format'

import { type EarnTransaction } from '../types'

// Case-insensitive equality for tx hashes. `viem` ships `isAddressEqual`
// for 20-byte addresses but no equivalent for 32-byte tx hashes — the
// canonical form is just lowercase hex, so a direct compare after
// lowercasing is sufficient. Accepts plain strings so callers reading
// from URL query params or local-store payloads don't need to cast.
// Returns false if either side is undefined so callers don't have to
// null-check separately.
export const hashesMatch = (a: string | undefined, b: string | undefined) =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase()

export const formatApyDisplay = function (apy: number) {
  if (apy < 0.01) {
    return '< 0.01%'
  }
  return formatPercentage(apy)
}

// The terminal on-chain hash for a delivery — claim for FINALIZED,
// recover for RECOVERED. Used by the drawer's waiting-for-shares step to
// render the "Confirmed" bottom row.
export const getTerminalDeliveryTxHash = function (
  tx: EarnTransaction | undefined,
) {
  if (tx?.status === 'FINALIZED') return tx.claimTxHash ?? undefined
  if (tx?.status === 'RECOVERED') return tx.recoverTxHash ?? undefined
  return undefined
}
