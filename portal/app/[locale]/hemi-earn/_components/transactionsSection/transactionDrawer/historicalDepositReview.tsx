'use client'

import { Operation } from 'components/reviewOperation/operation'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { hemi } from 'hemi-viem'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import { useTranslations } from 'next-intl'
import { type ReactNode } from 'react'
import { type EvmToken } from 'types/token'

import { SparkleIcon } from '../../../_icons/sparkleIcon'
import { getTerminalDeliveryTxHash } from '../../../_utils'
import {
  type EarnTransaction,
  type EarnTransactionStatusType,
} from '../../../types'

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
    stake: ProgressStatus.FAILED,
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

const isLocalRow = (tx: EarnTransaction) => tx.requestId.startsWith('local-')

// FAILED splits by source: local rows mean the Hemi tx itself reverted (stake
// step is FAILED), subgraph rows mean the Vetro Agent failed after a
// successful Hemi tx (stake step completed, failure is in the cross-chain
// step instead).
const resolveStepStates = (tx: EarnTransaction): StepStates =>
  tx.status === 'FAILED' && !isLocalRow(tx)
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
        <SparkleIcon />
        <span>{t('step.stake-token', { symbol: token.symbol })}</span>
      </div>
    ),
    explorerChainId: hemi.id,
    status,
    txHash: tx.requestTxHash,
  }
}

const buildWaitingForSharesStep = (
  tx: EarnTransaction,
  t: Translator,
  status: ProgressStatusType,
) => ({
  description: <span>{t('step.get-share-tokens')}</span>,
  status,
  txHash: getTerminalDeliveryTxHash(tx),
})

const buildApprovalStep = (
  approvalTxHash: NonNullable<EarnTransaction['approvalTxHash']>,
  token: EvmToken,
  t: Translator,
) => ({
  description: <span>{t('step.approve-token', { symbol: token.symbol })}</span>,
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

  const steps: StepPropsWithoutPosition[] = []
  // Re-approve only makes sense for local FAILED (Hemi tx reverted).
  if (
    transaction.status === 'FAILED' &&
    isLocalRow(transaction) &&
    needsApproval
  ) {
    steps.push({
      description: <span>{t('step.approval-needed')}</span>,
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
  steps.push(buildWaitingForSharesStep(transaction, t, waitingForShares))

  return (
    <Operation
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
