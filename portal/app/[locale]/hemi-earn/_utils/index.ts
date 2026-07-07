import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type Token } from 'types/token'
import { formatPercentage } from 'utils/format'
import { type Address, type Hash, isAddressEqual } from 'viem'

import {
  type EarnPool,
  type EarnSettlement,
  type EarnTransaction,
  type LocalEarnOperation,
} from '../types'

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

// A FULFILLED request awaiting a manual claim — the user signs
// `claim{Deposit,Redeem}(id)` to receive the tokens (shares for a deposit, the
// underlying asset for a redeem). Auto-finalize runs in the same tx as the
// fulfillment (`Router._handleRequestFulfillment`), so a request only *rests* at
// FULFILLED when it was manual (`automatic === false`) OR auto-finalize reverted
// (caught, `AutoFinalizationFailed`) — both leave the manual claim as the escape,
// so the `automatic` flag isn't checked here.
export const needsManualClaim = (tx: EarnTransaction) =>
  tx.status === 'FULFILLED'

// A CANCELLED request awaiting a manual recover — the user signs
// `recover{Deposit,Redeem}(id)` to pull the original tokens to their wallet (the
// asset for a deposit, the shares for a redeem). Like `needsManualClaim`, a
// request only rests at CANCELLED when it was manual or auto-recover reverted —
// both need the manual recover, so `automatic` isn't checked. `recover*` reverts
// unless the request is CANCELLED, so this is the only valid state.
export const needsRecover = (tx: EarnTransaction) => tx.status === 'CANCELLED'

// Broader than `needsRecover`: any request on the recover branch (awaiting or
// past recovery), regardless of `automatic`. Drives the display — the terminal
// step shows the returned tokens (asset for a deposit, shares for a redeem), not
// the claimed ones — even when auto-recover means no CTA is shown.
export const isRecoverPath = (tx: EarnTransaction) =>
  tx.status === 'CANCELLED' || tx.status === 'RECOVERED'

// The Hemi `request*` tx reverted before it ever landed on-chain, so the user
// can re-run the original request. Subgraph FAILED rows are a different beast
// (handled elsewhere), hence the local-only gate.
export const canRetryRow = (tx: EarnTransaction) =>
  tx.status === 'FAILED' && isLocalEarnTransactionRow(tx)

// CANCEL and UNSTAKE markers share the `settlement` field with CLAIM/RECOVER
// but aren't claim/recover settlement txs (CANCEL is the deliberate-cancel
// signal; UNSTAKE is the Ethereum finalize). Strip them so the claim/recover
// machinery (failed badge, recover-step tx, manual CTA gating) never mistakes
// them for one of its own.
export const claimRecoverSettlement = (
  settlement: EarnSettlement | undefined,
) =>
  settlement?.kind === 'CANCEL' || settlement?.kind === 'UNSTAKE'
    ? undefined
    : settlement

export const unstakeSettlement = (settlement: EarnSettlement | undefined) =>
  settlement?.kind === 'UNSTAKE' ? settlement : undefined

// A manual claim/recover the user signed reverted on Hemi. The on-chain status
// is unchanged (still FULFILLED/CANCELLED), so we surface the revert as a
// failure in the badge/step and offer a retry, rather than trusting the now
// misleading "needed" state.
export const hasFailedSettlement = (tx: EarnTransaction) =>
  claimRecoverSettlement(tx.settlement)?.failed === true

// A deliberate user cancel still in flight, vs an Agent failure — both reach
// CANCELLED→recover, but only this reads neutrally. Detected by the indexed
// `cancellationRequested`, bridged by the local `CANCEL` marker during indexing
// lag. `!tx.failed` gates both signals: an Agent failure reads as a failure even
// with a lingering cancel marker (and a reverted cancel — failed marker — is out
// too; the modal owns that retry). Scoped to PENDING/CANCELLED — a cancel can
// lose the race to the redeem, so a terminal row reads as what happened.
export const isUserCancel = (tx: EarnTransaction) =>
  (tx.status === 'PENDING' || tx.status === 'CANCELLED') &&
  !tx.failed &&
  (tx.cancellationRequested === true ||
    (tx.settlement?.kind === 'CANCEL' && tx.settlement.failed !== true))

// A deliberate user cancel vs a keeper/Agent-failure recovery. Nature-only (no
// status scope), so it also answers a terminal RECOVERED row where
// `isUserCancel` no longer applies.
export const isDeliberateCancel = (tx: EarnTransaction) =>
  tx.cancellationRequested === true && !tx.failed

// Which explanatory banner (if any) a drawer should show above the settle CTA —
// undefined unless the row is awaiting an *untouched* manual claim (FULFILLED) or
// recover (CANCELLED). The shares/funds split follows the same delivered-token
// inversion as `SettleCta`: a deposit claim / redeem recover act on shares; a
// deposit recover / redeem claim act on the underlying asset (funds).
export const pickSettleBannerKey = function (
  tx: EarnTransaction | undefined,
):
  | 'cancelled'
  | 'claim-funds'
  | 'claim-shares'
  | 'recover-funds'
  | 'recover-shares'
  | undefined {
  if (!tx) return undefined
  // A deliberate cancel reads neutrally, not as a recover failure — even while
  // its CANCEL marker is still pending before the subgraph indexes the cancel.
  // `isUserCancel` already drops at RECOVERED, so the terminal step (not this
  // "returning your shares" banner) tells that story.
  if (isUserCancel(tx)) return 'cancelled'
  // A claim/recover marker means the user already engaged with that CTA
  // (Claiming…/Try again); the banner would contradict it. A CANCEL marker isn't
  // one, so it must not hide an Agent-failure recover banner.
  if (claimRecoverSettlement(tx.settlement)) return undefined
  const operation = needsManualClaim(tx)
    ? 'CLAIM'
    : needsRecover(tx)
      ? 'RECOVER'
      : undefined
  if (!operation) return undefined
  const deliversShares = (tx.kind === 'DEPOSIT') === (operation === 'CLAIM')
  if (operation === 'CLAIM') {
    return deliversShares ? 'claim-shares' : 'claim-funds'
  }
  return deliversShares ? 'recover-shares' : 'recover-funds'
}

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
        token: transaction.amountOut === null ? shareToken : assetToken,
      }
    : { rawAmount: transaction.amountIn, token: assetToken }

// Reads the manual claim/recover settlement marker straight from the local
// store, keyed by the request tx — for callers holding a raw (not
// merge-enriched) subgraph row, like the live pool drawers.
export const findLocalSettlement = (
  localOperations: LocalEarnOperation[],
  requestTxHash: Hash | undefined,
): EarnSettlement | undefined =>
  requestTxHash
    ? localOperations.find(
        op =>
          op.initiateTxHash && hashesMatch(op.initiateTxHash, requestTxHash),
      )?.settlement
    : undefined

// Folds the local settlement into a raw subgraph row before handing it to the
// CTA — otherwise the button can't reflect the pending/reverted claim/recover
// (it'd stay on the idle label after a revert).
export const enrichWithSettlement = (
  row: EarnTransaction | undefined,
  settlement: EarnSettlement | undefined,
): EarnTransaction | undefined =>
  row && settlement ? { ...row, settlement } : row

export const isEarnRowTerminal = (tx: EarnTransaction) =>
  tx.status === 'FINALIZED' || tx.status === 'RECOVERED'

// A row the table is still actively tracking — drives both the polling loop and
// the row spinner. Out of flight: the subgraph-terminal statuses (see
// `isEarnRowTerminal`) plus a *local* FAILED (the Hemi `request*` tx reverted —
// it's never indexed and never transitions on its own; the user retries from
// home). A *subgraph* FAILED is the Agent failing cross-chain, which still walks
// to CANCELLED→RECOVERED (auto-recover or the keeper cancel), so it stays in
// flight — otherwise the table stops polling at the transient FAILED and never
// catches the RECOVERED. A CANCELLED request (any kind) likewise stays in
// flight, mirroring how a FULFILLED request walks to FINALIZED.
export const isEarnRowInFlight = (tx: EarnTransaction) =>
  !isEarnRowTerminal(tx) &&
  !(tx.status === 'FAILED' && isLocalEarnTransactionRow(tx))

export const isAwaitingFinalize = (tx: EarnTransaction) =>
  tx.kind === 'REDEEM' &&
  tx.status === 'PENDING' &&
  (tx.claimableAt ?? null) !== null &&
  (tx.processedAt ?? null) === null &&
  !isUserCancel(tx)

export const isFinalizeInFlight = (tx: EarnTransaction | undefined) =>
  (tx?.processedAt ?? null) !== null ||
  unstakeSettlement(tx?.settlement)?.failed === false

export const isCooldownMature = (
  tx: EarnTransaction,
  remainingSec: number | undefined,
) => isAwaitingFinalize(tx) && remainingSec === 0

// The progress ladder shared by a withdraw's terminal step — the receive step on
// the claim path, the recover step on the cancel path — across both the live and
// historical drawers. Same precedence in every case: done → COMPLETED; a reverted
// settlement → FAILED; a mining one → PROGRESS; an untouched manual settlement →
// READY (the user must sign, nothing is spinning yet); otherwise the caller's
// in-flight `fallback` (cooldown-derived for receive, PROGRESS for recover).
export const resolveSettleStepStatus = function ({
  awaitingAction,
  fallback,
  isComplete,
  settlementFailed,
  settlementTxHash,
}: {
  awaitingAction: boolean
  fallback: ProgressStatusType
  isComplete: boolean
  settlementFailed: boolean
  settlementTxHash: Hash | undefined
}): ProgressStatusType {
  if (isComplete) return ProgressStatus.COMPLETED
  if (settlementFailed) return ProgressStatus.FAILED
  if (settlementTxHash) return ProgressStatus.PROGRESS
  if (awaitingAction) return ProgressStatus.READY
  return fallback
}
