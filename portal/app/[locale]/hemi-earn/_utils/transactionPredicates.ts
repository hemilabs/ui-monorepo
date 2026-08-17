import { type EarnTransaction } from '../types'

import { type FailureCategory } from './decodeFailureReason'
import {
  claimRecoverSettlement,
  remoteFailedSettlement,
  unstakeSettlement,
} from './settlement'

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
  tx !== undefined &&
  tx.status === 'FAILED' &&
  tx.failed &&
  !isLocalEarnTransactionRow(tx)

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
const remoteFailedGraceSeconds = 120

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
  return receivedAt > 0 && nowSec - receivedAt > remoteFailedGraceSeconds
}
