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
import { useToken } from 'hooks/useToken'
import { useTranslations } from 'next-intl'
import { type ReactNode } from 'react'
import { type EvmToken } from 'types/token'
import { useAccount } from 'wagmi'

import { useCooldownDuration } from '../../../_hooks/useCooldownDuration'
import { useIsCooldownEligible } from '../../../_hooks/useIsCooldownEligible'
import {
  getTerminalDeliveryTxHash,
  isLocalEarnTransactionRow,
} from '../../../_utils'
import { deriveCooldownPostAction } from '../../../pool/[shareAddress]/_components/poolReview/cooldownPostAction'
import { useEarnCooldownRemaining } from '../../../pool/[shareAddress]/_hooks/useEarnCooldownRemaining'
import {
  type EarnPool,
  type EarnTransaction,
  type EarnTransactionStatusType,
} from '../../../types'

type Props = {
  callToAction?: ReactNode
  onClose: VoidFunction
  pool: EarnPool
  transaction: EarnTransaction
}

type Translator = ReturnType<
  typeof useTranslations<'hemi-earn.transactions.drawer'>
>

type StepStates = {
  unstake: ProgressStatusType
  receive: ProgressStatusType
}

const stepStatesByStatus: Record<EarnTransactionStatusType, StepStates> = {
  CANCELLED: {
    receive: ProgressStatus.NOT_READY,
    unstake: ProgressStatus.FAILED,
  },
  FAILED: {
    receive: ProgressStatus.NOT_READY,
    unstake: ProgressStatus.FAILED,
  },
  FINALIZED: {
    receive: ProgressStatus.COMPLETED,
    unstake: ProgressStatus.COMPLETED,
  },
  FULFILLED: {
    receive: ProgressStatus.PROGRESS,
    unstake: ProgressStatus.COMPLETED,
  },
  PENDING: {
    receive: ProgressStatus.NOT_READY,
    unstake: ProgressStatus.COMPLETED,
  },
  RECOVERED: {
    receive: ProgressStatus.COMPLETED,
    unstake: ProgressStatus.COMPLETED,
  },
  TX_PENDING: {
    receive: ProgressStatus.NOT_READY,
    unstake: ProgressStatus.PROGRESS,
  },
}

// FAILED splits by source: local rows mean the Hemi tx itself reverted
// (unstake step is FAILED), subgraph rows mean the Vetro Agent failed after a
// successful Hemi tx (unstake completed, failure is in the cross-chain step).
const resolveStepStates = (tx: EarnTransaction): StepStates =>
  tx.status === 'FAILED' && !isLocalEarnTransactionRow(tx)
    ? {
        receive: ProgressStatus.FAILED,
        unstake: ProgressStatus.COMPLETED,
      }
    : stepStatesByStatus[tx.status]

const buildUnstakeStep = (
  tx: EarnTransaction,
  shareToken: EvmToken,
  t: Translator,
) => ({
  description: (
    <div className="flex items-center gap-x-2">
      <TokenLogo size="small" token={shareToken} />
      <span>{t('step.unstake-token', { symbol: shareToken.symbol })}</span>
    </div>
  ),
  explorerChainId: hemi.id,
  status: resolveStepStates(tx).unstake,
  txHash: tx.requestTxHash,
})

const pickDisplay = (
  tx: EarnTransaction,
  shareToken: EvmToken,
  assetToken: EvmToken | undefined,
) =>
  tx.amountOut != null
    ? { amount: tx.amountOut, token: assetToken }
    : { amount: tx.amountIn, token: shareToken }

const buildReceiveStep = (
  tx: EarnTransaction,
  receiveToken: EvmToken,
  t: Translator,
  status: ProgressStatusType,
) => ({
  description: (
    <div className="flex items-center gap-x-2">
      <TokenLogo size="small" token={receiveToken} />
      <span>{t('step.receive-token', { symbol: receiveToken.symbol })}</span>
    </div>
  ),
  status,
  txHash: getTerminalDeliveryTxHash(tx),
})

const buildApprovalStep = (
  approvalTxHash: NonNullable<EarnTransaction['approvalTxHash']>,
  shareToken: EvmToken,
  t: Translator,
) => ({
  description: (
    <span>{t('step.approve-token', { symbol: shareToken.symbol })}</span>
  ),
  explorerChainId: hemi.id,
  status: ProgressStatus.COMPLETED,
  txHash: approvalTxHash,
})

export const HistoricalWithdrawReview = function ({
  callToAction,
  onClose,
  pool,
  transaction,
}: Props) {
  const t = useTranslations('hemi-earn.transactions.drawer')
  // The cooldown sub-step copy is shared with the live pool review; keep
  // it under `pool.drawer` instead of duplicating the keys here.
  const tCooldown = useTranslations('hemi-earn.pool.drawer')
  const { address } = useAccount()

  // `useToken` returns `Token | undefined` (BtcToken | EvmToken); for the
  // Hemi-side asset address this is always an EvmToken.
  const { data: rawReceiveToken } = useToken({
    address: transaction.asset,
    chainId: hemi.id,
  })
  const receiveToken = rawReceiveToken as EvmToken | undefined

  const { needsApproval } = useNeedsApproval({
    address: pool.shareAddress,
    amount: BigInt(transaction.amountIn),
    chainId: hemi.id,
    spender: getHemiEarnRouterAddress(),
  })

  const { data: isCooldownEligible } = useIsCooldownEligible({
    account: address,
    stakingVault: pool.stakingVault,
  })

  const { data: cooldownDurationSec } = useCooldownDuration({
    stakingVault: pool.stakingVault,
  })

  const cooldownRemainingSec = useEarnCooldownRemaining(
    transaction.claimableAt != null
      ? BigInt(transaction.claimableAt)
      : undefined,
  )

  const { receive, unstake } = resolveStepStates(transaction)
  const unstakeMined = unstake === ProgressStatus.COMPLETED

  const cooldownPostAction = deriveCooldownPostAction({
    cooldownDurationSec,
    cooldownRemainingSec,
    isCooldownEligible,
    subgraphStatus: transaction.status,
    t: tCooldown,
    unstakeMined,
  })

  // Show shareToken while we only have amountIn (share units); switch to
  // the asset token once amountOut lands (asset units). Same rule the
  // AmountCell applies to table rows.
  const { amount: displayAmount, token: displayToken } = pickDisplay(
    transaction,
    pool.shareToken,
    receiveToken,
  )

  const steps: StepPropsWithoutPosition[] = []
  // Re-approve only makes sense for local FAILED (Hemi tx reverted).
  if (
    transaction.status === 'FAILED' &&
    isLocalEarnTransactionRow(transaction) &&
    needsApproval
  ) {
    steps.push({
      description: <span>{t('step.approval-needed')}</span>,
      status: ProgressStatus.NOT_READY,
    })
  }
  // Only locally-mirrored entries carry `approvalTxHash` — see the merge
  // in `useEarnTransactions`. Rows opened from another browser/device won't
  // have this step (indexer doesn't link approval to request).
  if (transaction.approvalTxHash) {
    steps.push(
      buildApprovalStep(transaction.approvalTxHash, pool.shareToken, t),
    )
  }
  const unstakeStep = buildUnstakeStep(transaction, pool.shareToken, t)
  steps.push(
    cooldownPostAction
      ? { ...unstakeStep, postAction: cooldownPostAction }
      : unstakeStep,
  )
  if (receiveToken) {
    steps.push(buildReceiveStep(transaction, receiveToken, t, receive))
  }

  if (!displayToken) {
    return null
  }

  return (
    <Operation
      amount={displayAmount}
      callToAction={callToAction}
      heading={t('withdraw-heading')}
      onClose={onClose}
      steps={steps}
      subheading={t('withdraw-subheading')}
      token={displayToken}
    />
  )
}
