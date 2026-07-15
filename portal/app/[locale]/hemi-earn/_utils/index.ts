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

import { type FailureCategory } from './decodeFailureReason'

export const hashesMatch = (a: string | undefined, b: string | undefined) =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase()

export const formatApyDisplay = function (apy: number) {
  if (apy !== 0 && apy > -0.01 && apy < 0.01) {
    return apy > 0 ? '< 0.01%' : '< -0.01%'
  }
  return formatPercentage(apy)
}

export const getTerminalDeliveryTxHash = function (
  tx: EarnTransaction | undefined,
) {
  if (tx?.status === 'FINALIZED') return tx.claimTxHash ?? undefined
  if (tx?.status === 'RECOVERED') return tx.recoverTxHash ?? undefined
  return undefined
}

export const findPoolByAsset = (
  pools: EarnPool[],
  asset: Address,
): EarnPool | undefined =>
  pools.find(p => p.assets.some(a => isAddressEqual(a.address, asset)))

export const findPoolByShare = (
  pools: EarnPool[],
  shareAddress: Address,
): EarnPool | undefined =>
  pools.find(p => isAddressEqual(p.shareAddress, shareAddress))

// Local rows = the Hemi request tx reverted (retryable); subgraph FAILED = the Agent failed after a successful Hemi tx.
export const isLocalEarnTransactionRow = (tx: EarnTransaction) =>
  tx.requestId.startsWith('local-')

// Auto-finalize runs inline, so a request rests at FULFILLED only when manual or
// auto-finalize reverted — manual claim is the escape either way (automatic not checked).
export const needsManualClaim = (tx: EarnTransaction) =>
  tx.status === 'FULFILLED'

// Recover-path mirror of needsManualClaim; recover* reverts unless CANCELLED, so it's the only valid state.
export const needsRecover = (tx: EarnTransaction) => tx.status === 'CANCELLED'

// Any request on the recover branch (awaiting or past), regardless of automatic — drives the returned-token display.
export const isRecoverPath = (tx: EarnTransaction) =>
  tx.status === 'CANCELLED' || tx.status === 'RECOVERED'

// Local FAILED = the request reverted before landing, so the user can re-run it (subgraph FAILED is handled elsewhere).
export const canRetryRow = (tx: EarnTransaction) =>
  tx.status === 'FAILED' && isLocalEarnTransactionRow(tx)

// Subgraph FAILED sibling of canRetryRow: the Agent reverted on Ethereum after a good Hemi
// tx, so the request is stuck remotely and the user drives Agent.retry / Agent.cancel.
export const isRemoteFailed = (tx: EarnTransaction | undefined) =>
  !!tx && tx.status === 'FAILED' && tx.failed && !isLocalEarnTransactionRow(tx)

// CANCEL/UNSTAKE/RETRY/CANCEL_REQUEST reuse the settlement field but aren't claim/recover
// txs — strip them so the claim/recover UI never treats them as its own.
export const claimRecoverSettlement = (
  settlement: EarnSettlement | undefined,
) =>
  settlement?.kind === 'CANCEL' ||
  settlement?.kind === 'UNSTAKE' ||
  settlement?.kind === 'RETRY' ||
  settlement?.kind === 'CANCEL_REQUEST'
    ? undefined
    : settlement

export const unstakeSettlement = (settlement: EarnSettlement | undefined) =>
  settlement?.kind === 'UNSTAKE' ? settlement : undefined

export const remoteFailedSettlement = (
  settlement: EarnSettlement | undefined,
) =>
  settlement?.kind === 'RETRY' || settlement?.kind === 'CANCEL_REQUEST'
    ? settlement
    : undefined

// Remote-failed receive step: FAILED only once the CTA is surfaced (stuck past the grace, no
// retry/cancel in flight); in-progress otherwise (grace window or a signed recovery mining).
export const remoteFailedStepStatus = function (
  ready: boolean,
  settlement: EarnSettlement | undefined,
) {
  const marker = remoteFailedSettlement(settlement)
  const inFlight = !!marker && !marker.failed
  return ready && !inFlight ? ProgressStatus.FAILED : ProgressStatus.PROGRESS
}

// A remote-failed request whose chosen recovery is cancel, which returns tokenIn (funds for a
// deposit, shares for a redeem) — the terminal step should show that returned token, not the
// fulfillment. Keys off the signed CANCEL_REQUEST marker, so it flips once the cancel is signed.
export const isRemoteFailedCancel = (tx: EarnTransaction | undefined) =>
  isRemoteFailed(tx) &&
  remoteFailedSettlement(tx?.settlement)?.kind === 'CANCEL_REQUEST'

// A signed claim/recover reverted while the on-chain status stayed FULFILLED/CANCELLED — surface it as failed, not "needed".
export const hasFailedSettlement = (tx: EarnTransaction) =>
  claimRecoverSettlement(tx.settlement)?.failed === true

// A deliberate cancel still in flight (reads neutrally) vs an Agent failure. !failed gates
// both the indexed flag and the local CANCEL marker; scoped to PENDING/CANCELLED so a terminal row reads as what happened.
export const isUserCancel = (tx: EarnTransaction) =>
  (tx.status === 'PENDING' || tx.status === 'CANCELLED') &&
  !tx.failed &&
  (tx.cancellationRequested === true ||
    (tx.settlement?.kind === 'CANCEL' && tx.settlement.failed !== true))

// Like isUserCancel but nature-only (no status scope), so it also answers a terminal RECOVERED row.
export const isDeliberateCancel = (tx: EarnTransaction) =>
  tx.cancellationRequested === true && !tx.failed

// Banner above the settle CTA; undefined unless awaiting an untouched claim/recover.
// shares/funds follow the same delivered-token inversion as SettleCta.
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
  // A deliberate cancel reads neutrally, not as a recover failure (isUserCancel drops at RECOVERED).
  if (isUserCancel(tx)) return 'cancelled'
  // A claim/recover marker means the user already engaged that CTA; don't also show the banner.
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

// DEPOSIT renders amountIn (asset units) — never amountOut, which is 18-dec shares.
// REDEEM renders shares until amountOut (the returned asset) lands at fulfillment.
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

// Reads the settlement marker straight from the local store for callers holding a raw (un-enriched) subgraph row.
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

// Fold the local settlement into a raw row so the CTA can reflect a pending/reverted claim/recover.
export const enrichWithSettlement = (
  row: EarnTransaction | undefined,
  settlement: EarnSettlement | undefined,
): EarnTransaction | undefined =>
  row && settlement ? { ...row, settlement } : row

export const isEarnRowTerminal = (tx: EarnTransaction) =>
  tx.status === 'FINALIZED' || tx.status === 'RECOVERED'

// Drives polling + the row spinner. Out of flight = subgraph-terminal or a local FAILED
// (never indexed); a subgraph FAILED stays in flight so polling catches the eventual RECOVERED.
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

// Grace before offering Retry/Cancel on a remote failure, so the keeper gets first crack at
// auto-recovering it. Anchored on the request's receivedAt (== the failure block).
const REMOTE_FAILED_GRACE_SECONDS = 120

// Grace gate for the remote-failed CTAs: stay quiet right after the failure so the keeper can
// auto-recover, unless slippage (needs a user call), a keeper retry already failed, or the grace elapsed.
export const shouldShowRemoteFailedCtas = function ({
  category,
  isStuck,
  nowSec,
  tx,
}: {
  category: FailureCategory
  isStuck: boolean
  nowSec: number
  tx: EarnTransaction
}) {
  if (!isStuck) return false
  if (category === 'slippage') return true
  if ((tx.retryCount ?? 0) > 0) return true
  // Guard against a missing / '0' / non-numeric receivedAt so the grace can't be skipped by Number(...) === 0.
  const receivedAt = Number(tx.receivedAt ?? 0)
  return receivedAt > 0 && nowSec - receivedAt > REMOTE_FAILED_GRACE_SECONDS
}

// Shared terminal-step ladder for both drawers' receive (claim) and recover steps;
// untouched manual settlements resolve to READY (nothing spinning yet), else the caller's fallback.
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
