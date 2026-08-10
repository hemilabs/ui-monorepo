import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { mainnet } from 'networks/mainnet'
import { type Chain, type Hash } from 'viem'

import { type EarnSettlement, type EarnTransaction } from '../types'

import { claimRecoverSettlement, remoteFailedSettlement } from './settlement'
import {
  isUserCancel,
  needsManualClaim,
  needsRecover,
} from './transactionPredicates'

export const getTerminalDeliveryTxHash = function (
  tx: EarnTransaction | undefined,
) {
  if (tx?.status === 'FINALIZED') return tx.claimTxHash ?? undefined
  if (tx?.status === 'RECOVERED') return tx.recoverTxHash ?? undefined
  return undefined
}

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

// A remote-failed retry/cancel is signed on the Agent's L1, so its step link points to mainnet;
// any other delivery hash lives on the request's own chain.
export const resolveStepExplorerChainId = ({
  fallbackChainId,
  settlement,
  txHash,
}: {
  fallbackChainId: Chain['id']
  settlement: EarnSettlement | undefined
  txHash: Hash | undefined
}) =>
  txHash === undefined
    ? undefined
    : txHash === remoteFailedSettlement(settlement)?.txHash
      ? mainnet.id
      : fallbackChainId

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
