'use client'

import { Operation } from 'components/reviewOperation/operation'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { TokenLogo } from 'components/tokenLogo'
import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { encodeRequestRedeem } from 'hemi-earn-actions/actions'
import { useChain } from 'hooks/useChain'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import { useTranslations } from 'next-intl'
import { type EvmToken } from 'types/token'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { type Address, type Hash, formatUnits } from 'viem'
import { useAccount, useEstimateGas } from 'wagmi'

import {
  ClaimFromVaultBanner,
  ClaimFromVaultCta,
} from '../../../../_components/transactionsSection/transactionDrawer/claimFromVault'
import {
  RemoteFailedBanner,
  RemoteFailedCta,
} from '../../../../_components/transactionsSection/transactionDrawer/remoteFailed'
import {
  AddTokenToWalletCta,
  SettleBanner,
  SettleCta,
} from '../../../../_components/transactionsSection/transactionDrawer/settleShared'
import {
  REDEEM_SLIPPAGE_BPS,
  applySlippage,
} from '../../../../_constants/slippage'
import { useCooldownDuration } from '../../../../_hooks/useCooldownDuration'
import { useEarnTransactionsQuery } from '../../../../_hooks/useEarnTransactionsQuery'
import { useIsCooldownEligible } from '../../../../_hooks/useIsCooldownEligible'
import { useLocalEarnOperations } from '../../../../_hooks/useLocalEarnOperations'
import { useRemoteFailedState } from '../../../../_hooks/useRemoteFailedState'
import {
  claimRecoverSettlement,
  enrichWithSettlement,
  findLocalSettlement,
  getTerminalDeliveryTxHash,
  hashesMatch,
  isAwaitingFinalize,
  isFinalizeInFlight,
  isRecoverPath,
  isRemoteFailed,
  isUserCancel,
  needsManualClaim,
  needsRecover,
  remoteFailedStepStatus,
  resolveSettleStepStatus,
} from '../../../../_utils'
import { type EarnSettlement, type EarnTransaction } from '../../../../types'
import { usePoolForm } from '../../_context/poolFormContext'
import { useEarnCooldownRemaining } from '../../_hooks/useEarnCooldownRemaining'
import { useQuoteRedeem } from '../../_hooks/useQuoteRedeem'
import { useSharesToAssets } from '../../_hooks/useSharesToAssets'
import {
  WithdrawStatus,
  type WithdrawStatusType,
} from '../../_types/operations'

import { deriveCooldownPostAction } from './cooldownPostAction'
import { RetryWithdraw } from './retryWithdraw'

type Props = {
  onClose: VoidFunction
}

const resolveReceiveStatus = ({
  awaitingClaim,
  crossChainInFlight,
  isFinalized,
  settlement,
  settlementTxHash,
}: {
  awaitingClaim: boolean
  crossChainInFlight: boolean
  isFinalized: boolean
  settlement: EarnSettlement | undefined
  settlementTxHash: Hash | undefined
}): ProgressStatusType =>
  resolveSettleStepStatus({
    awaitingAction: awaitingClaim,
    fallback: crossChainInFlight
      ? ProgressStatus.PROGRESS
      : ProgressStatus.NOT_READY,
    isComplete: isFinalized,
    settlementFailed: settlement?.failed ?? false,
    settlementTxHash,
  })

function resolveReceiveProgress({
  cooldownElapsed,
  isFinalized,
  needsCooldown,
  row,
  settlement,
  settlementTxHash,
  unstakeMined,
}: {
  cooldownElapsed: boolean
  isFinalized: boolean
  needsCooldown: boolean
  row: EarnTransaction | undefined
  settlement: EarnSettlement | undefined
  settlementTxHash: Hash | undefined
  unstakeMined: boolean
}): ProgressStatusType {
  const finalizeInFlight = isFinalizeInFlight(row)
  const matureAwaitingFinalize =
    row?.status === 'PENDING' &&
    (row?.claimableAt ?? null) !== null &&
    cooldownElapsed &&
    !finalizeInFlight
  return resolveReceiveStatus({
    awaitingClaim: (!!row && needsManualClaim(row)) || matureAwaitingFinalize,
    crossChainInFlight: unstakeMined && (!needsCooldown || finalizeInFlight),
    isFinalized,
    settlement,
    settlementTxHash,
  })
}

function buildReceiveStep({
  chainId,
  cooldownRemainingSec,
  isCooldownEligible,
  receiveToken,
  row,
  t,
  withdrawStatus,
}: {
  chainId: EvmToken['chainId']
  cooldownRemainingSec: number | undefined
  isCooldownEligible: boolean | undefined
  receiveToken: EvmToken
  row: EarnTransaction | undefined
  t: ReturnType<typeof useTranslations<'hemi-earn.pool.drawer'>>
  withdrawStatus: WithdrawStatusType
}): StepPropsWithoutPosition {
  // Only FINALIZED delivers the asset; RECOVERED returns shares (rendered by addRecoverStep).
  const isFinalized = row?.status === 'FINALIZED'
  const claimTxHash = isFinalized ? (row?.claimTxHash ?? undefined) : undefined
  // Strip a CANCEL marker so it can't fail this step (receive only tracks claim/recover).
  const settlement = claimRecoverSettlement(row?.settlement)
  const settlementTxHash =
    settlement && !settlement.failed ? settlement.txHash : undefined
  const unstakeMined = withdrawStatus === WithdrawStatus.WITHDRAW_TX_CONFIRMED
  // Default to cooldown while eligibility loads; cooldownElapsed checks whether the timer finished.
  const needsCooldown = isCooldownEligible !== false
  const cooldownElapsed = cooldownRemainingSec === 0
  const deliveryHash = settlementTxHash ?? claimTxHash
  return {
    description: (
      <div className="flex items-center gap-x-2">
        <TokenLogo size="small" token={receiveToken} />
        <span>{t('receive-token', { symbol: receiveToken.symbol })}</span>
      </div>
    ),
    explorerChainId: chainId,
    status: resolveReceiveProgress({
      cooldownElapsed,
      isFinalized,
      needsCooldown,
      row,
      settlement,
      settlementTxHash,
      unstakeMined,
    }),
    txHash: deliveryHash,
  }
}

const FAILED_STATUSES: WithdrawStatusType[] = [
  WithdrawStatus.APPROVAL_TX_FAILED,
  WithdrawStatus.WITHDRAW_TX_FAILED,
]

// Recover-step adapter to the shared ladder; auto-recover (no manual action) rests at PROGRESS.
const resolveRecoverStepStatus = ({
  isComplete,
  needsRecoverAction,
  settlementFailed,
  settlementTxHash,
}: {
  isComplete: boolean
  needsRecoverAction: boolean
  settlementFailed: boolean
  settlementTxHash: Hash | undefined
}): ProgressStatusType =>
  resolveSettleStepStatus({
    awaitingAction: needsRecoverAction,
    fallback: ProgressStatus.PROGRESS,
    isComplete,
    settlementFailed,
    settlementTxHash,
  })

function encodeRedeemForGasEstimate({
  account,
  assetAddress,
  assetsOutMin,
  quote,
  shares,
}: {
  account: Address | undefined
  assetAddress: Address
  assetsOutMin: bigint
  quote:
    | { callbackFee: bigint; isInstant: boolean; nativeFee: bigint }
    | undefined
  shares: bigint
}) {
  if (!account || !quote || shares <= BigInt(0)) return undefined
  return encodeRequestRedeem({
    asset: assetAddress,
    assetsOutMin,
    callbackFee: quote.callbackFee,
    isInstant: quote.isInstant,
    operator: account,
    receiver: account,
    shares,
  })
}

export const ReviewWithdraw = function ({ onClose }: Props) {
  const { input, pool, selectedAsset, withdrawOperation } = usePoolForm()
  const t = useTranslations('hemi-earn.pool.drawer')
  const chainId = selectedAsset.token.chainId
  const chain = useChain(chainId)
  const { address } = useAccount()

  // Shared subscription with the layout watcher; lets the receive step sync to the subgraph status.
  const { data: subgraphRows = [] } = useEarnTransactionsQuery()
  const subgraphRow = subgraphRows.find(
    r =>
      r.kind === 'REDEEM' &&
      hashesMatch(r.requestTxHash, withdrawOperation?.transactionHash),
  )

  const { localOperations } = useLocalEarnOperations()
  const settlement = findLocalSettlement(
    localOperations,
    subgraphRow?.requestTxHash,
  )
  const settledRow = enrichWithSettlement(subgraphRow, settlement)
  // A still-PENDING deliberate cancel reads as the recover it's becoming: drop the countdown, render the recover step.
  const cancelling = !!settledRow && isUserCancel(settledRow)
  const { show: remoteFailedReady } = useRemoteFailedState(settledRow)

  const { data: isCooldownEligible } = useIsCooldownEligible({
    account: address,
    stakingVault: pool.stakingVault,
  })
  // Pool-level cooldown duration drives the static "wait N days" copy before there's a request to query.
  const { data: cooldownDurationSec } = useCooldownDuration({
    stakingVault: pool.stakingVault,
  })
  const cooldownRemainingSec = useEarnCooldownRemaining(
    subgraphRow?.claimableAt != null
      ? BigInt(subgraphRow.claimableAt)
      : undefined,
  )

  const withdrawStatus =
    withdrawOperation?.status ?? WithdrawStatus.APPROVAL_TX_COMPLETED

  // Input is in share units — the Router burns shares directly; assetsOutMin comes from the asset preview below.
  const shares = parseTokenUnits(input, pool.shareToken)
  const routerAddress = getHemiEarnRouterAddress()

  const { data: { assetOut } = { assetOut: BigInt(0) } } = useSharesToAssets({
    assetAddress: selectedAsset.address,
    shareAddress: pool.shareAddress,
    shares,
  })

  const assetsOutMin =
    assetOut > BigInt(0)
      ? applySlippage(assetOut, REDEEM_SLIPPAGE_BPS)
      : BigInt(0)

  const { needsApproval } = useNeedsApproval({
    address: pool.shareAddress,
    amount: shares,
    chainId,
    spender: routerAddress,
  })

  const { fees: approvalGasFees, isError: isApprovalGasFeesError } =
    useEstimateApproveErc20Fees({
      amount: shares,
      enabled: [
        WithdrawStatus.APPROVAL_TX_FAILED,
        WithdrawStatus.APPROVAL_TX_PENDING,
      ].includes(withdrawStatus),
      spender: routerAddress,
      token: pool.shareToken,
    })

  const { data: quote } = useQuoteRedeem({
    asset: selectedAsset.address,
    shareAddress: pool.shareAddress,
    shares,
  })

  const { data: withdrawGasUnits, isError: isWithdrawGasUnitsError } =
    useEstimateGas({
      data: encodeRedeemForGasEstimate({
        account: address,
        assetAddress: selectedAsset.address,
        assetsOutMin,
        quote,
        shares,
      }),
      query: { enabled: !!address && shares > BigInt(0) && !!quote },
      to: routerAddress as Address,
      value: quote?.nativeFee,
    })

  const { fees: withdrawGasFees, isError: isWithdrawGasFeesError } =
    useEstimateFees({
      chainId,
      gasUnits: withdrawGasUnits,
      isGasUnitsError: isWithdrawGasUnitsError,
    })

  const nativeDecimals = chain?.nativeCurrency.decimals ?? 18
  const layerZeroFee = quote?.nativeFee ?? BigInt(0)

  const getStepFees = ({
    fee,
    isError,
    show,
  }: {
    fee: bigint
    isError: boolean
    show: boolean
  }): StepPropsWithoutPosition['fees'] =>
    show
      ? {
          amount: formatUnits(fee, nativeDecimals),
          isError,
          token: getNativeToken(chainId),
        }
      : undefined

  const addApprovalStep = function (): StepPropsWithoutPosition {
    const showFees = [
      WithdrawStatus.APPROVAL_TX_FAILED,
      WithdrawStatus.APPROVAL_TX_PENDING,
    ].includes(withdrawStatus)

    const statusMap: Partial<Record<WithdrawStatusType, ProgressStatusType>> = {
      [WithdrawStatus.APPROVAL_TX_FAILED]: ProgressStatus.FAILED,
      [WithdrawStatus.APPROVAL_TX_PENDING]: ProgressStatus.PROGRESS,
    }

    return {
      description: (
        <div className="flex items-center gap-x-2">
          <TokenLogo size="small" token={pool.shareToken} />
          <span
            className={`text-sm font-normal ${
              withdrawStatus === WithdrawStatus.APPROVAL_TX_PENDING
                ? 'text-orange-600'
                : 'text-neutral-500'
            }`}
          >
            {t('approving', { symbol: pool.shareToken.symbol })}
          </span>
        </div>
      ),
      explorerChainId: chainId,
      fees: getStepFees({
        fee: approvalGasFees,
        isError: isApprovalGasFeesError,
        show: showFees,
      }),
      status: statusMap[withdrawStatus] ?? ProgressStatus.COMPLETED,
      txHash: withdrawOperation?.approvalTxHash,
    }
  }

  const addUnstakeStep = function (): StepPropsWithoutPosition {
    const statusMap: Record<WithdrawStatusType, ProgressStatusType> = {
      [WithdrawStatus.APPROVAL_TX_PENDING]: ProgressStatus.NOT_READY,
      [WithdrawStatus.APPROVAL_TX_FAILED]: ProgressStatus.NOT_READY,
      [WithdrawStatus.APPROVAL_TX_COMPLETED]: ProgressStatus.READY,
      [WithdrawStatus.WITHDRAW_TX_PENDING]: ProgressStatus.PROGRESS,
      [WithdrawStatus.WITHDRAW_TX_FAILED]: ProgressStatus.FAILED,
      [WithdrawStatus.WITHDRAW_TX_CONFIRMED]: ProgressStatus.COMPLETED,
    }

    const showFees = [
      WithdrawStatus.APPROVAL_TX_COMPLETED,
      WithdrawStatus.WITHDRAW_TX_PENDING,
      WithdrawStatus.WITHDRAW_TX_FAILED,
    ].includes(withdrawStatus)

    // LayerZero fee is msg.value on the same requestRedeem tx, so fold it into the withdraw line (mirrors the deposit review).
    const withdrawLineTotal = withdrawGasFees + layerZeroFee

    return {
      description: (
        <div className="flex items-center gap-x-2">
          <TokenLogo size="small" token={pool.shareToken} />
          <span>{t('unstake-token', { symbol: pool.shareToken.symbol })}</span>
        </div>
      ),
      explorerChainId: chainId,
      fees: getStepFees({
        fee: withdrawLineTotal,
        isError: isWithdrawGasFeesError,
        show: showFees,
      }),
      postAction: cancelling
        ? undefined
        : deriveCooldownPostAction({
            cooldownDurationSec,
            cooldownRemainingSec,
            isCooldownEligible,
            subgraphStatus: subgraphRow?.status,
            t,
            unstakeMined:
              withdrawStatus === WithdrawStatus.WITHDRAW_TX_CONFIRMED,
          }),
      status: statusMap[withdrawStatus] ?? ProgressStatus.NOT_READY,
      txHash: withdrawOperation?.transactionHash,
    }
  }

  const addRecoverStep = function (): StepPropsWithoutPosition {
    // Drop the CANCEL marker so it doesn't pose as this step's transaction.
    const settleMarker = claimRecoverSettlement(settlement)
    const settlementTxHash =
      settleMarker && !settleMarker.failed ? settleMarker.txHash : undefined
    const isComplete = subgraphRow?.status === 'RECOVERED'
    const deliveryHash =
      settlementTxHash ?? getTerminalDeliveryTxHash(subgraphRow)
    return {
      description: (
        <div className="flex items-center gap-x-2">
          <TokenLogo size="small" token={pool.shareToken} />
          <span>{t(isComplete ? 'shares-returned' : 'shares-to-recover')}</span>
        </div>
      ),
      explorerChainId: chainId,
      status: resolveRecoverStepStatus({
        isComplete,
        needsRecoverAction: !!settledRow && needsRecover(settledRow),
        settlementFailed: settleMarker?.failed ?? false,
        settlementTxHash,
      }),
      txHash: deliveryHash,
    }
  }

  const getCallToAction = function () {
    if (FAILED_STATUSES.includes(withdrawStatus)) {
      return <RetryWithdraw />
    }
    if (isRemoteFailed(settledRow)) {
      return <RemoteFailedCta transaction={settledRow!} />
    }
    if (settledRow && isAwaitingFinalize(settledRow)) {
      return <ClaimFromVaultCta transaction={settledRow} />
    }
    // Auto-claim off: the user signs the claim once the Agent delivers the asset back (FULFILLED).
    if (settledRow && needsManualClaim(settledRow)) {
      return (
        <SettleCta
          asset={selectedAsset}
          operation="CLAIM"
          pool={pool}
          transaction={settledRow}
        />
      )
    }
    // Cancelled: the shares are back on the Router; the user signs recover to pull them to their wallet.
    if (settledRow && needsRecover(settledRow)) {
      return (
        <SettleCta
          asset={selectedAsset}
          operation="RECOVER"
          pool={pool}
          transaction={settledRow}
        />
      )
    }
    // The asset only lands once cross-chain delivery completes (FINALIZED).
    if (subgraphRow?.status === 'FINALIZED') {
      return <AddTokenToWalletCta token={selectedAsset.token} />
    }
    return null
  }

  const getSteps = function () {
    const steps: StepPropsWithoutPosition[] = []
    if (needsApproval || withdrawOperation?.approvalTxHash) {
      steps.push(addApprovalStep())
    }
    steps.push(addUnstakeStep())
    if ((settledRow && isRecoverPath(settledRow)) || cancelling) {
      steps.push(addRecoverStep())
      return steps
    }
    const receiveStep = buildReceiveStep({
      chainId,
      cooldownRemainingSec,
      isCooldownEligible,
      receiveToken: selectedAsset.token,
      row: settledRow,
      t,
      withdrawStatus,
    })
    // Remote failure: FAILED only when the CTA is surfaced; in-progress during the grace or
    // while a retry/cancel is being signed/mined.
    steps.push(
      isRemoteFailed(settledRow)
        ? {
            ...receiveStep,
            status: remoteFailedStepStatus(
              remoteFailedReady,
              settledRow?.settlement,
            ),
          }
        : receiveStep,
    )
    return steps
  }

  return (
    <Operation
      aboveCallToAction={
        <>
          <SettleBanner transaction={settledRow} />
          <ClaimFromVaultBanner transaction={settledRow} />
          <RemoteFailedBanner transaction={settledRow} />
        </>
      }
      amount={withdrawOperation?.amountIn ?? shares.toString()}
      callToAction={getCallToAction()}
      heading={t('withdraw.heading')}
      onClose={onClose}
      steps={getSteps()}
      subheading={t('withdraw.subheading')}
      token={pool.shareToken}
    />
  )
}
