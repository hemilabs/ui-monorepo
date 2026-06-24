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

import { SparkleIcon } from '../../../_icons/sparkleIcon'
import {
  getTerminalDeliveryTxHash,
  isLocalEarnTransactionRow,
  isRecoverPath,
  needsManualClaim,
  needsRecover,
} from '../../../_utils'
import {
  type EarnTransaction,
  type EarnTransactionStatusType,
} from '../../../types'

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
    // The request tx landed (stake done); the cancel/return shows in the
    // recover-path terminal step, not a failed stake.
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

// FAILED splits by source: local rows mean the Hemi tx itself reverted (stake
// step is FAILED), subgraph rows mean the Vetro Agent failed after a
// successful Hemi tx (stake step completed, failure is in the cross-chain
// step instead).
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

// COMPLETED wins over everything; a reverted settlement → FAILED; a mining tx →
// PROGRESS; a pending manual action → READY (active, not a spinner); else the
// natural status.
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

// Happy path → "Get share tokens"; recover path → "Funds returned" (the asset
// comes back, so it's labeled with the asset token).
function buildTerminalStep({
  baseStatus,
  settlementTxHash,
  t,
  token,
  tx,
}: {
  baseStatus: ProgressStatusType
  settlementTxHash: Hash | undefined
  t: Translator
  token: EvmToken
  tx: EarnTransaction
}): StepPropsWithoutPosition {
  const status = resolveTerminalStatus(tx, baseStatus, settlementTxHash)
  const txHash = settlementTxHash ?? getTerminalDeliveryTxHash(tx)
  // Link whenever a delivery hash is available — an auto-finalized claim/recover
  // has one too, even though the user didn't sign it.
  const explorerChainId = txHash ? hemi.id : undefined
  if (isRecoverPath(tx)) {
    // "Funds returned" only once RECOVERED; CANCELLED still awaits the recover.
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

  const { waitingForShares } = resolveStepStates(transaction)
  // Only a still-mining settlement drives the step to PROGRESS; a failed one
  // leaves the natural (FAILED) status and surfaces a Retry CTA instead.
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
  // Only the locally-mirrored entries carry `approvalTxHash` (see merge in
  // `useEarnTransactions`). Rows opened from another browser/device won't
  // have this step — the indexer doesn't link an approval tx to a request.
  if (transaction.approvalTxHash) {
    steps.push(buildApprovalStep(transaction.approvalTxHash, token, t))
  }
  steps.push(buildStakeStep(transaction, token, t))
  steps.push(
    buildTerminalStep({
      baseStatus: waitingForShares,
      settlementTxHash,
      t,
      token,
      tx: transaction,
    }),
  )

  return (
    <Operation
      aboveCallToAction={<SettleBanner transaction={transaction} />}
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
