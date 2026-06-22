import { type Token } from 'types/token'
import { formatPercentage } from 'utils/format'
import { type Address, isAddressEqual } from 'viem'

import { type EarnPool, type EarnTransaction } from '../types'

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
  if (apy !== 0 && apy > -0.01 && apy < 0.01) {
    return apy > 0 ? '< 0.01%' : '< -0.01%'
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

// Resolves an `EarnPool` keyed by a Hemi-side asset address (a share can
// accept multiple deposit assets, so we match on `pool.assets`). Returns
// `undefined` when the asset isn't registered against any pool.
export const findPoolByAsset = (
  pools: EarnPool[],
  asset: Address,
): EarnPool | undefined =>
  pools.find(p => p.assets.some(a => isAddressEqual(a.address, asset)))

// Resolves an `EarnPool` keyed by its share OFT address.
export const findPoolByShare = (
  pools: EarnPool[],
  shareAddress: Address,
): EarnPool | undefined =>
  pools.find(p => isAddressEqual(p.shareAddress, shareAddress))

// Local rows mean the Hemi `request*` tx reverted; subgraph rows mean the
// Agent failed after a successful Hemi tx (recover, not retry).
export const isLocalEarnTransactionRow = (tx: EarnTransaction) =>
  tx.requestId.startsWith('local-')

// A FULFILLED deposit with auto-claim off: the shares are back on the Router
// but the user must sign `claimDeposit(id)` to receive them.
export const needsManualClaim = (tx: EarnTransaction) =>
  tx.kind === 'DEPOSIT' && tx.status === 'FULFILLED' && tx.automatic === false

// A CANCELLED deposit with auto-recover off: the original asset is back on the
// Router and the user must sign `recoverDeposit(id)` to pull it to their wallet.
// `recoverDeposit` reverts unless the request is CANCELLED, so this is the only
// state where the Recover CTA is valid.
export const needsRecover = (tx: EarnTransaction) =>
  tx.kind === 'DEPOSIT' && tx.status === 'CANCELLED' && tx.automatic === false

// Broader than `needsRecover`: any deposit on the recover branch (awaiting or
// past recovery), regardless of `automatic`. Drives the display — the terminal
// step shows the returned asset, not shares — even when auto-recover means no
// CTA is shown.
export const isRecoverPath = (tx: EarnTransaction) =>
  tx.kind === 'DEPOSIT' &&
  (tx.status === 'CANCELLED' || tx.status === 'RECOVERED')

// The Hemi `request*` tx reverted before it ever landed on-chain, so the user
// can re-run the original request. Subgraph FAILED rows are a different beast
// (handled elsewhere), hence the local-only gate.
export const canRetryRow = (tx: EarnTransaction) =>
  tx.status === 'FAILED' && isLocalEarnTransactionRow(tx)

// A manual claim/recover the user signed reverted on Hemi. The on-chain status
// is unchanged (still FULFILLED/CANCELLED), so we surface the revert as a
// failure in the badge/step and offer a retry, rather than trusting the now
// misleading "needed" state.
export const hasFailedSettlement = (tx: EarnTransaction) =>
  tx.settlement?.failed === true

// Picks the amount + token to render for an earn transaction row. A DEPOSIT
// always shows the deposited asset (`amountIn`, asset units) — its `amountOut`
// is the minted share amount (sVetToken, 18 decimals) and must never be rendered
// against the 8-decimal asset token. A REDEEM shows shares (`amountIn` +
// shareToken) while `amountOut` is unset, then the returned asset (`amountOut` +
// assetToken) once it's populated at fulfillment.
export const pickEarnRowAmount = (
  transaction: EarnTransaction,
  { assetToken, shareToken }: { assetToken?: Token; shareToken?: Token },
): { rawAmount: string; token: Token | undefined } =>
  transaction.kind === 'REDEEM'
    ? {
        rawAmount: transaction.amountOut ?? transaction.amountIn,
        token: transaction.amountOut == null ? shareToken : assetToken,
      }
    : { rawAmount: transaction.amountIn, token: assetToken }

// A row the table is still actively tracking — drives both the polling loop and
// the row spinner. Terminal: FINALIZED/RECOVERED/FAILED for any kind, plus a
// CANCELLED REDEEM (withdrawal canceled). A CANCELLED DEPOSIT stays in flight:
// it still walks to RECOVERED, whether auto-recover or via the user's recover,
// so the table keeps polling and reflects it (even across devices/sessions),
// mirroring how a FULFILLED deposit walks to FINALIZED.
export const isEarnRowInFlight = (tx: EarnTransaction) =>
  tx.status !== 'FINALIZED' &&
  tx.status !== 'RECOVERED' &&
  tx.status !== 'FAILED' &&
  !(tx.status === 'CANCELLED' && tx.kind === 'REDEEM')
