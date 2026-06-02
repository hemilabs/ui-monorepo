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
  CLAIMED: {
    stake: ProgressStatus.COMPLETED,
    waitingForShares: ProgressStatus.COMPLETED,
  },
  FAILED: {
    stake: ProgressStatus.FAILED,
    waitingForShares: ProgressStatus.NOT_READY,
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

function buildStakeStep(tx: EarnTransaction, token: EvmToken, t: Translator) {
  const status = stepStatesByStatus[tx.status].stake
  return {
    description: (
      <div className="flex items-center gap-x-2">
        <SparkleIcon />
        <span>{t('step.stake-token', { symbol: token.symbol })}</span>
      </div>
    ),
    explorerChainId: hemi.id,
    status,
    txHash: tx.initiateTxHash,
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

  const { waitingForShares } = stepStatesByStatus[transaction.status]

  const steps: StepPropsWithoutPosition[] = []
  if (transaction.status === 'FAILED' && needsApproval) {
    steps.push({
      description: <span>{t('step.approval-needed')}</span>,
      status: ProgressStatus.NOT_READY,
    })
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
