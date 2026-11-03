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
import { type ReactNode } from 'react'
import { type EvmToken } from 'types/token'
import { useTranslations } from 'use-intl'
import { type Hash } from 'viem'
import { useAccount } from 'wagmi'

import { defaultRedeemSlippage } from '../../../_constants/slippage'
import { useCooldownDuration } from '../../../_hooks/useCooldownDuration'
import { useIsCooldownEligible } from '../../../_hooks/useIsCooldownEligible'
import { useRemoteFailedState } from '../../../_hooks/useRemoteFailedState'
import { useVaultMetadata } from '../../../_hooks/useVaultMetadata'
import {
  inTransitPostAction,
  isCrossingNetworks,
} from '../../../_utils/inTransit'
import { claimRecoverSettlement } from '../../../_utils/settlement'
import {
  getTerminalDeliveryTxHash,
  remoteFailedStepStatus,
  resolveSettleStepStatus,
} from '../../../_utils/settleUi'
import {
  isAwaitingFinalize,
  isEarnRowTerminal,
  isFinalizeInFlight,
  isLocalEarnTransactionRow,
  isLocalSettlementInFlight,
  isRecoverPath,
  isRemoteFailed,
  isRemoteFailedCancel,
  isUserCancel,
  needsManualClaim,
  needsRecover,
} from '../../../_utils/transactionPredicates'
import {
  type EarnTransaction,
  type EarnTransactionStatusType,
  type EarnVault,
} from '../../../types'
import { deriveCooldownPostAction } from '../../../vault/[shareAddress]/_components/vaultReview/cooldownPostAction'
import { useEarnCooldownRemaining } from '../../../vault/[shareAddress]/_hooks/useEarnCooldownRemaining'
import { OperatorNote } from '../../operatorDisclosure'

import { ClaimFromVaultBanner } from './claimFromVault'
import { RemoteFailedBanner } from './remoteFailed'
import { SettleBanner } from './settleShared'
import { RetrySlippageTooltip } from './slippageTooltip'

type Props = {
  callToAction?: ReactNode
  onClose: VoidFunction
  transaction: EarnTransaction
  vault: EarnVault
}

type Translator = ReturnType<
  typeof useTranslations<'hemi-earn.transactions.drawer'>
>

type StepStates = {
  receive: ProgressStatusType
  withdraw: ProgressStatusType
}

const stepStatesByStatus: Record<EarnTransactionStatusType, StepStates> = {
  CANCELLED: {
    // A cancelled redeem isn't a failed withdraw — the request landed; shares come back via the recover path.
    receive: ProgressStatus.NOT_READY,
    withdraw: ProgressStatus.COMPLETED,
  },
  FAILED: {
    receive: ProgressStatus.NOT_READY,
    withdraw: ProgressStatus.FAILED,
  },
  FINALIZED: {
    receive: ProgressStatus.COMPLETED,
    withdraw: ProgressStatus.COMPLETED,
  },
  FULFILLED: {
    receive: ProgressStatus.PROGRESS,
    withdraw: ProgressStatus.COMPLETED,
  },
  PENDING: {
    receive: ProgressStatus.NOT_READY,
    withdraw: ProgressStatus.COMPLETED,
  },
  RECOVERED: {
    receive: ProgressStatus.COMPLETED,
    withdraw: ProgressStatus.COMPLETED,
  },
  TX_PENDING: {
    receive: ProgressStatus.NOT_READY,
    withdraw: ProgressStatus.PROGRESS,
  },
}

// FAILED splits by source: local = Hemi tx reverted (withdraw FAILED); subgraph =
// Agent failed after a good Hemi tx (failure in the cross-chain step).
const resolveStepStates = (tx: EarnTransaction): StepStates =>
  tx.status === 'FAILED' && !isLocalEarnTransactionRow(tx)
    ? {
        receive: ProgressStatus.FAILED,
        withdraw: ProgressStatus.COMPLETED,
      }
    : stepStatesByStatus[tx.status]

const buildWithdrawStep = (
  tx: EarnTransaction,
  shareToken: EvmToken,
  t: Translator,
) => ({
  description: (
    <div className="flex items-center gap-x-2">
      <TokenLogo size="small" token={shareToken} />
      <span>{t('step.withdraw-token', { symbol: shareToken.symbol })}</span>
    </div>
  ),
  explorerChainId: hemi.id,
  status: resolveStepStates(tx).withdraw,
  txHash: tx.requestTxHash,
})

const pickDisplay = (
  tx: EarnTransaction,
  shareToken: EvmToken,
  assetToken: EvmToken | undefined,
) =>
  tx.amountOut !== null
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
  // Link the mining claim while still FULFILLED — the terminal claimTxHash only lands at FINALIZED.
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

// Recover returns the SHARES (not the asset), so the terminal step is labeled with the share token.
function buildRecoverStep(
  tx: EarnTransaction,
  shareToken: EvmToken,
  t: Translator,
  settlementTxHash: Hash | undefined,
) {
  // Link the mining recover tx while CANCELLED — the terminal recoverTxHash only lands at RECOVERED.
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
      settlementFailed: claimRecoverSettlement(tx.settlement)?.failed ?? false,
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
  finalizeInFlight,
  isCooldownEligible,
  receiveFromStatus,
  withdrawMined,
}: {
  cooldownRemainingSec: number | undefined
  finalizeInFlight: boolean
  isCooldownEligible: boolean | undefined
  receiveFromStatus: ProgressStatusType
  withdrawMined: boolean
}): ProgressStatusType {
  if (receiveFromStatus !== ProgressStatus.NOT_READY) return receiveFromStatus
  if (!withdrawMined) return receiveFromStatus
  if (isCooldownEligible === false) return ProgressStatus.PROGRESS
  if (cooldownRemainingSec !== 0) return receiveFromStatus

  return finalizeInFlight ? ProgressStatus.PROGRESS : ProgressStatus.READY
}

function buildSteps({
  cooldownPostAction,
  needsApproval,
  receive,
  receivePostAction,
  receiveToken,
  settlementTxHash,
  t,
  transaction,
  vault,
}: {
  cooldownPostAction: ReturnType<typeof deriveCooldownPostAction>
  needsApproval: boolean
  receive: ProgressStatusType
  receivePostAction: ReturnType<typeof inTransitPostAction>
  receiveToken: EvmToken | undefined
  settlementTxHash: Hash | undefined
  t: Translator
  transaction: EarnTransaction
  vault: EarnVault
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
          <TokenLogo size="small" token={vault.shareToken} />
          <span>{t('step.approval-needed')}</span>
        </div>
      ),
      status: ProgressStatus.NOT_READY,
    })
  }
  if (transaction.approvalTxHash) {
    steps.push(
      buildApprovalStep(transaction.approvalTxHash, vault.shareToken, t),
    )
  }
  const withdrawStep = buildWithdrawStep(transaction, vault.shareToken, t)
  // Recover path: shares come back, so the cooldown/receive machinery doesn't apply. A
  // still-PENDING deliberate cancel joins here too, dropping the now-moot countdown + Receive step.
  if (
    isRecoverPath(transaction) ||
    isUserCancel(transaction) ||
    isRemoteFailedCancel(transaction)
  ) {
    steps.push(withdrawStep)
    steps.push(
      buildRecoverStep(transaction, vault.shareToken, t, settlementTxHash),
    )
    return steps
  }
  steps.push(
    cooldownPostAction
      ? { ...withdrawStep, postAction: cooldownPostAction }
      : withdrawStep,
  )
  if (receiveToken) {
    steps.push({
      ...buildReceiveStep({
        receiveToken,
        settlementTxHash,
        status: receive,
        t,
        tx: transaction,
      }),
      postAction: receivePostAction,
    })
  }
  return steps
}

export const HistoricalWithdrawReview = function ({
  callToAction,
  onClose,
  transaction,
  vault,
}: Props) {
  const t = useTranslations('hemi-earn.transactions.drawer')
  // Cooldown copy is shared with the live vault review — reuse the vault.drawer namespace instead of duplicating keys.
  const tCooldown = useTranslations('hemi-earn.vault.drawer')
  const vaultMetadata = useVaultMetadata(vault.stakingVault)
  const { address } = useAccount()

  // useToken returns Token | undefined; for the Hemi-side asset it's always an EvmToken.
  const { data: rawReceiveToken } = useToken({
    address: transaction.asset,
    chainId: hemi.id,
  })
  const receiveToken = rawReceiveToken as EvmToken | undefined

  const { needsApproval } = useNeedsApproval({
    address: vault.shareAddress,
    amount: BigInt(transaction.amountIn),
    chainId: hemi.id,
    spender: getHemiEarnRouterAddress(),
  })

  const { data: isCooldownEligible } = useIsCooldownEligible({
    account: address,
    stakingVault: vault.stakingVault,
  })

  const { data: cooldownDurationSec } = useCooldownDuration({
    enabled: !isEarnRowTerminal(transaction),
    stakingVault: vault.stakingVault,
  })

  const claimableAt = transaction.claimableAt ?? null
  const cooldownRemainingSec = useEarnCooldownRemaining(
    claimableAt !== null ? BigInt(claimableAt) : undefined,
  )

  const { show: remoteFailedReady } = useRemoteFailedState(transaction)

  const { receive: receiveFromStatus, withdraw } =
    resolveStepStates(transaction)
  const withdrawMined = withdraw === ProgressStatus.COMPLETED
  // Drop the CANCEL marker so it doesn't pose as the recover step's transaction.
  const settleMarker = claimRecoverSettlement(transaction.settlement)
  const settlementTxHash =
    settleMarker && !settleMarker.failed ? settleMarker.txHash : undefined

  const finalizeInFlight = isFinalizeInFlight(transaction)
  const cooldownDerived = deriveReceiveStatus({
    cooldownRemainingSec,
    finalizeInFlight,
    isCooldownEligible,
    receiveFromStatus,
    withdrawMined,
  })
  // Receive step tracks the remote-failed sub-state (FAILED only when the CTA is surfaced).
  const receive = isRemoteFailed(transaction)
    ? remoteFailedStepStatus(remoteFailedReady, transaction.settlement)
    : resolveSettleStepStatus({
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
    withdrawMined,
  })

  const { amount: displayAmount, token: displayToken } = pickDisplay(
    transaction,
    vault.shareToken,
    receiveToken,
  )

  if (!displayToken) {
    return null
  }

  const steps = buildSteps({
    cooldownPostAction,
    needsApproval,
    receive,
    receivePostAction: inTransitPostAction({
      duration: vaultMetadata?.typicalDuration,
      isCrossing: isCrossingNetworks({
        isAwaitingCooldown: isAwaitingFinalize(transaction),
        isRemoteFail: isRemoteFailed(transaction),
        isSettlingLocally: isLocalSettlementInFlight(transaction),
        isStepInProgress: receive === ProgressStatus.PROGRESS,
      }),
      t: tCooldown,
    }),
    receiveToken,
    settlementTxHash,
    t,
    transaction,
    vault,
  })

  return (
    <Operation
      aboveCallToAction={
        <>
          <SettleBanner transaction={transaction} />
          <ClaimFromVaultBanner transaction={transaction} />
          <RemoteFailedBanner transaction={transaction} />
        </>
      }
      amount={displayAmount}
      belowSubheading={<OperatorNote />}
      callToAction={callToAction}
      endAdornment={
        <RetrySlippageTooltip
          fallback={defaultRedeemSlippage}
          transaction={transaction}
        />
      }
      heading={t('withdraw-heading')}
      onClose={onClose}
      steps={steps}
      subheading={t('withdraw-subheading')}
      token={displayToken}
    />
  )
}
