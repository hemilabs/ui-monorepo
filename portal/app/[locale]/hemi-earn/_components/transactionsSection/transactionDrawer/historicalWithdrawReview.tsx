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
import { type Hash } from 'viem'
import { useAccount } from 'wagmi'

import { useCooldownDuration } from '../../../_hooks/useCooldownDuration'
import { useIsCooldownEligible } from '../../../_hooks/useIsCooldownEligible'
import {
  claimRecoverSettlement,
  getTerminalDeliveryTxHash,
  isLocalEarnTransactionRow,
  isRecoverPath,
  isUserCancel,
  needsManualClaim,
  needsRecover,
  resolveSettleStepStatus,
} from '../../../_utils'
import { deriveCooldownPostAction } from '../../../pool/[shareAddress]/_components/poolReview/cooldownPostAction'
import { useEarnCooldownRemaining } from '../../../pool/[shareAddress]/_hooks/useEarnCooldownRemaining'
import {
  type EarnPool,
  type EarnTransaction,
  type EarnTransactionStatusType,
} from '../../../types'

import { SettleBanner } from './settleShared'

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
    // A cancelled redeem isn't a failed unstake — the request landed and the
    // shares are coming back via the recover path.
    receive: ProgressStatus.NOT_READY,
    unstake: ProgressStatus.COMPLETED,
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

function buildReceiveStep({
  receiveToken,
  settlementTxHash,
  status,
  t,
  tx,
}: {
  receiveToken: EvmToken
  settlementTxHash: Hash | undefined
  status: ProgressStatusType
  t: Translator
  tx: EarnTransaction
}) {
  // Link the mining claim while still FULFILLED (the terminal `claimTxHash` only
  // lands once FINALIZED), matching the deposit drawer.
  const txHash = settlementTxHash ?? getTerminalDeliveryTxHash(tx)
  return {
    description: (
      <div className="flex items-center gap-x-2">
        <TokenLogo size="small" token={receiveToken} />
        <span>{t('step.receive-token', { symbol: receiveToken.symbol })}</span>
      </div>
    ),
    explorerChainId: hemi.id,
    status,
    txHash,
  }
}

// On the recover path the user gets the SHARES back (not the asset), so the
// terminal step is labeled with the share token: "Shares to recover" while
// CANCELLED, "Shares returned" once RECOVERED.
function buildRecoverStep(
  tx: EarnTransaction,
  shareToken: EvmToken,
  t: Translator,
  settlementTxHash: Hash | undefined,
) {
  // Link the mining manual-recover tx while CANCELLED (its terminal
  // `recoverTxHash` only lands once RECOVERED), matching the deposit drawer.
  const txHash = settlementTxHash ?? getTerminalDeliveryTxHash(tx)
  return {
    description: (
      <div className="flex items-center gap-x-2">
        <TokenLogo size="small" token={shareToken} />
        <span>
          {t(
            tx.status === 'RECOVERED'
              ? 'step.shares-returned'
              : 'step.shares-to-recover',
          )}
        </span>
      </div>
    ),
    explorerChainId: hemi.id,
    status: resolveSettleStepStatus({
      awaitingAction: needsRecover(tx),
      fallback: ProgressStatus.PROGRESS,
      isComplete: tx.status === 'RECOVERED',
      settlementFailed: tx.settlement?.failed ?? false,
      settlementTxHash,
    }),
    txHash,
  }
}

const buildApprovalStep = (
  approvalTxHash: NonNullable<EarnTransaction['approvalTxHash']>,
  shareToken: EvmToken,
  t: Translator,
) => ({
  description: (
    <div className="flex items-center gap-x-2">
      <TokenLogo size="small" token={shareToken} />
      <span>{t('step.approve-token', { symbol: shareToken.symbol })}</span>
    </div>
  ),
  explorerChainId: hemi.id,
  status: ProgressStatus.COMPLETED,
  txHash: approvalTxHash,
})

function deriveReceiveStatus({
  cooldownRemainingSec,
  isCooldownEligible,
  receiveFromStatus,
  unstakeMined,
}: {
  cooldownRemainingSec: number | undefined
  isCooldownEligible: boolean | undefined
  receiveFromStatus: ProgressStatusType
  unstakeMined: boolean
}): ProgressStatusType {
  if (receiveFromStatus !== ProgressStatus.NOT_READY) return receiveFromStatus
  if (!unstakeMined) return receiveFromStatus
  const needsCooldown = isCooldownEligible !== false
  const cooldownElapsed = cooldownRemainingSec === 0
  return !needsCooldown || cooldownElapsed
    ? ProgressStatus.PROGRESS
    : receiveFromStatus
}

function buildSteps({
  cooldownPostAction,
  needsApproval,
  pool,
  receive,
  receiveToken,
  settlementTxHash,
  t,
  transaction,
}: {
  cooldownPostAction: ReturnType<typeof deriveCooldownPostAction>
  needsApproval: boolean
  pool: EarnPool
  receive: ProgressStatusType
  receiveToken: EvmToken | undefined
  settlementTxHash: Hash | undefined
  t: Translator
  transaction: EarnTransaction
}): StepPropsWithoutPosition[] {
  const steps: StepPropsWithoutPosition[] = []
  if (
    transaction.status === 'FAILED' &&
    isLocalEarnTransactionRow(transaction) &&
    needsApproval
  ) {
    steps.push({
      description: (
        <div className="flex items-center gap-x-2">
          <TokenLogo size="small" token={pool.shareToken} />
          <span>{t('step.approval-needed')}</span>
        </div>
      ),
      status: ProgressStatus.NOT_READY,
    })
  }
  if (transaction.approvalTxHash) {
    steps.push(
      buildApprovalStep(transaction.approvalTxHash, pool.shareToken, t),
    )
  }
  const unstakeStep = buildUnstakeStep(transaction, pool.shareToken, t)
  // Recover path: the unstake landed and the shares come back (not the asset),
  // so the cooldown/receive machinery doesn't apply. A deliberate cancel still
  // PENDING (the keeper hasn't driven it to CANCELLED yet) joins this branch so
  // the drawer drops the now-moot cooldown countdown + "Receive" step and reads
  // as the recover it's becoming — matching the neutral "cancelling" banner.
  if (isRecoverPath(transaction) || isUserCancel(transaction)) {
    steps.push(unstakeStep)
    steps.push(
      buildRecoverStep(transaction, pool.shareToken, t, settlementTxHash),
    )
    return steps
  }
  steps.push(
    cooldownPostAction
      ? { ...unstakeStep, postAction: cooldownPostAction }
      : unstakeStep,
  )
  if (receiveToken) {
    steps.push(
      buildReceiveStep({
        receiveToken,
        settlementTxHash,
        status: receive,
        t,
        tx: transaction,
      }),
    )
  }
  return steps
}

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

  const claimableAt = transaction.claimableAt ?? null
  const cooldownRemainingSec = useEarnCooldownRemaining(
    claimableAt !== null ? BigInt(claimableAt) : undefined,
  )

  const { receive: receiveFromStatus, unstake } = resolveStepStates(transaction)
  const unstakeMined = unstake === ProgressStatus.COMPLETED
  // Drop the CANCEL marker so it doesn't pose as the recover step's transaction.
  const settleMarker = claimRecoverSettlement(transaction.settlement)
  const settlementTxHash =
    settleMarker && !settleMarker.failed ? settleMarker.txHash : undefined
  const cooldownDerived = deriveReceiveStatus({
    cooldownRemainingSec,
    isCooldownEligible,
    receiveFromStatus,
    unstakeMined,
  })
  const receive = resolveSettleStepStatus({
    awaitingAction: needsManualClaim(transaction),
    fallback: cooldownDerived,
    isComplete: cooldownDerived === ProgressStatus.COMPLETED,
    settlementFailed: settleMarker?.failed ?? false,
    settlementTxHash,
  })

  const cooldownPostAction = deriveCooldownPostAction({
    cooldownDurationSec,
    cooldownRemainingSec,
    isCooldownEligible,
    subgraphStatus: transaction.status,
    t: tCooldown,
    unstakeMined,
  })

  const { amount: displayAmount, token: displayToken } = pickDisplay(
    transaction,
    pool.shareToken,
    receiveToken,
  )

  if (!displayToken) {
    return null
  }

  const steps = buildSteps({
    cooldownPostAction,
    needsApproval,
    pool,
    receive,
    receiveToken,
    settlementTxHash,
    t,
    transaction,
  })

  return (
    <Operation
      aboveCallToAction={<SettleBanner transaction={transaction} />}
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
