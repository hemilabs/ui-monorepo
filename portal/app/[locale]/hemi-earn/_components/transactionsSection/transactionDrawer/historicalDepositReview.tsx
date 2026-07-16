'use client'

import { Operation } from 'components/reviewOperation/operation'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { TokenLogo } from 'components/tokenLogo'
import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { hemi } from 'hemi-viem'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import { useTranslations } from 'next-intl'
import { type ReactNode } from 'react'
import { type EvmToken } from 'types/token'
import { type Hash } from 'viem'

import { useRemoteFailedState } from '../../../_hooks/useRemoteFailedState'
import { SparkleIcon } from '../../../_icons/sparkleIcon'
import {
  getTerminalDeliveryTxHash,
  isLocalEarnTransactionRow,
  isRecoverPath,
  isRemoteFailed,
  isRemoteFailedCancel,
  needsManualClaim,
  needsRecover,
  remoteFailedStepStatus,
  resolveStepExplorerChainId,
} from '../../../_utils'
import {
  type EarnTransaction,
  type EarnTransactionStatusType,
} from '../../../types'

import { RemoteFailedBanner } from './remoteFailed'
import { SettleBanner } from './settleShared'

type Props = {
  callToAction?: ReactNode
  onClose: VoidFunction
  token: EvmToken
  transaction: EarnTransaction
}

type Translator = ReturnType<
  typeof useTranslations<'hemi-earn.transactions.drawer'>
>

type StepStates = {
  stake: ProgressStatusType
  waitingForShares: ProgressStatusType
}

const stepStatesByStatus: Record<EarnTransactionStatusType, StepStates> = {
  CANCELLED: {
    // Request landed (stake done); the cancel/return shows in the terminal step, not a failed stake.
    stake: ProgressStatus.COMPLETED,
    waitingForShares: ProgressStatus.NOT_READY,
  },
  FAILED: {
    stake: ProgressStatus.FAILED,
    waitingForShares: ProgressStatus.NOT_READY,
  },
  FINALIZED: {
    stake: ProgressStatus.COMPLETED,
    waitingForShares: ProgressStatus.COMPLETED,
  },
  FULFILLED: {
    stake: ProgressStatus.COMPLETED,
    waitingForShares: ProgressStatus.PROGRESS,
  },
  PENDING: {
    stake: ProgressStatus.COMPLETED,
    waitingForShares: ProgressStatus.PROGRESS,
  },
  RECOVERED: {
    stake: ProgressStatus.COMPLETED,
    waitingForShares: ProgressStatus.COMPLETED,
  },
  TX_PENDING: {
    stake: ProgressStatus.PROGRESS,
    waitingForShares: ProgressStatus.NOT_READY,
  },
}

// FAILED splits by source: local = Hemi tx reverted (stake FAILED); subgraph =
// Agent failed after a good Hemi tx (failure in the cross-chain step).
const resolveStepStates = (tx: EarnTransaction): StepStates =>
  tx.status === 'FAILED' && !isLocalEarnTransactionRow(tx)
    ? {
        stake: ProgressStatus.COMPLETED,
        waitingForShares: ProgressStatus.FAILED,
      }
    : stepStatesByStatus[tx.status]

function buildStakeStep(tx: EarnTransaction, token: EvmToken, t: Translator) {
  const status = resolveStepStates(tx).stake
  return {
    description: (
      <div className="flex items-center gap-x-2">
        <TokenLogo size="small" token={token} />
        <span>{t('step.stake-token', { symbol: token.symbol })}</span>
      </div>
    ),
    explorerChainId: hemi.id,
    status,
    txHash: tx.requestTxHash,
  }
}

function resolveTerminalStatus(
  tx: EarnTransaction,
  baseStatus: ProgressStatusType,
  settlementTxHash: Hash | undefined,
): ProgressStatusType {
  const natural = isRecoverPath(tx)
    ? tx.status === 'RECOVERED'
      ? ProgressStatus.COMPLETED
      : ProgressStatus.PROGRESS
    : baseStatus
  if (natural === ProgressStatus.COMPLETED) return ProgressStatus.COMPLETED
  if (tx.settlement?.failed) return ProgressStatus.FAILED
  if (settlementTxHash) return ProgressStatus.PROGRESS
  if (needsManualClaim(tx) || needsRecover(tx)) return ProgressStatus.READY
  return natural
}

// Recover path returns the asset, so its terminal step is labeled with the asset token.
function buildTerminalStep({
  baseStatus,
  remoteFailedReady,
  settlementTxHash,
  t,
  token,
  tx,
}: {
  baseStatus: ProgressStatusType
  remoteFailedReady: boolean
  settlementTxHash: Hash | undefined
  t: Translator
  token: EvmToken
  tx: EarnTransaction
}): StepPropsWithoutPosition {
  const status = isRemoteFailed(tx)
    ? remoteFailedStepStatus(remoteFailedReady, tx.settlement)
    : resolveTerminalStatus(tx, baseStatus, settlementTxHash)
  const txHash = settlementTxHash ?? getTerminalDeliveryTxHash(tx)
  const explorerChainId = resolveStepExplorerChainId({
    fallbackChainId: hemi.id,
    settlement: tx.settlement,
    txHash,
  })
  if (isRecoverPath(tx) || isRemoteFailedCancel(tx)) {
    // "Funds returned" only once RECOVERED; CANCELLED / a signed remote-failed cancel awaits the recover.
    const recoverLabel =
      tx.status === 'RECOVERED'
        ? 'step.funds-returned'
        : 'step.funds-to-recover'
    return {
      description: (
        <div className="flex items-center gap-x-2">
          <TokenLogo size="small" token={token} />
          <span>{t(recoverLabel)}</span>
        </div>
      ),
      explorerChainId,
      status,
      txHash,
    }
  }
  return {
    description: (
      <div className="flex items-center gap-x-2">
        <SparkleIcon />
        <span>{t('step.get-share-tokens')}</span>
      </div>
    ),
    explorerChainId,
    status,
    txHash,
  }
}

const buildApprovalStep = (
  approvalTxHash: NonNullable<EarnTransaction['approvalTxHash']>,
  token: EvmToken,
  t: Translator,
) => ({
  description: (
    <div className="flex items-center gap-x-2">
      <TokenLogo size="small" token={token} />
      <span>{t('step.approve-token', { symbol: token.symbol })}</span>
    </div>
  ),
  explorerChainId: hemi.id,
  status: ProgressStatus.COMPLETED,
  txHash: approvalTxHash,
})

export const HistoricalDepositReview = function ({
  callToAction,
  onClose,
  token,
  transaction,
}: Props) {
  const t = useTranslations('hemi-earn.transactions.drawer')

  const { needsApproval } = useNeedsApproval({
    address: transaction.asset,
    amount: BigInt(transaction.amountIn),
    chainId: token.chainId,
    spender: getHemiEarnRouterAddress(),
  })

  const { show: remoteFailedReady } = useRemoteFailedState(transaction)

  const { waitingForShares } = resolveStepStates(transaction)
  // Only a still-mining settlement drives PROGRESS; a failed one keeps the natural (FAILED) status + Retry CTA.
  const { settlement } = transaction
  const settlementTxHash =
    settlement && !settlement.failed ? settlement.txHash : undefined

  const steps: StepPropsWithoutPosition[] = []
  // Re-approve only makes sense for local FAILED (Hemi tx reverted).
  if (
    transaction.status === 'FAILED' &&
    isLocalEarnTransactionRow(transaction) &&
    needsApproval
  ) {
    steps.push({
      description: (
        <div className="flex items-center gap-x-2">
          <TokenLogo size="small" token={token} />
          <span>{t('step.approval-needed')}</span>
        </div>
      ),
      status: ProgressStatus.NOT_READY,
    })
  }
  // Only local-mirror entries carry approvalTxHash; rows from another browser skip this step (the indexer can't link it).
  if (transaction.approvalTxHash) {
    steps.push(buildApprovalStep(transaction.approvalTxHash, token, t))
  }
  steps.push(buildStakeStep(transaction, token, t))
  steps.push(
    buildTerminalStep({
      baseStatus: waitingForShares,
      remoteFailedReady,
      settlementTxHash,
      t,
      token,
      tx: transaction,
    }),
  )

  return (
    <Operation
      aboveCallToAction={
        <>
          <SettleBanner transaction={transaction} />
          <RemoteFailedBanner transaction={transaction} />
        </>
      }
      amount={transaction.amountIn}
      callToAction={callToAction}
      heading={t('deposit-heading')}
      onClose={onClose}
      steps={steps}
      subheading={t('deposit-subheading')}
      token={token}
    />
  )
}
