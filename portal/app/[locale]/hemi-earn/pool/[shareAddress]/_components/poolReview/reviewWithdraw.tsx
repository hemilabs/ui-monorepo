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
  AddTokenToWalletCta,
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
import {
  enrichWithSettlement,
  findLocalSettlement,
  getTerminalDeliveryTxHash,
  hashesMatch,
  isRecoverPath,
  needsManualClaim,
  needsRecover,
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

// Adapts the receive step's local state to the shared `resolveSettleStepStatus`
// ladder. A thin wrapper (not inlined) so `buildReceiveStep` stays under the
// complexity threshold.
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

// Maps the settlement-enriched row, local withdraw status, and cooldown state to
// the receive step's progress + terminal hash. Module-level so the component
// stays under the complexity threshold.
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
  // Only FINALIZED actually delivers the underlying asset (the recover path —
  // RECOVERED — returns shares instead and is rendered by `addRecoverStep`).
  const isFinalized = row?.status === 'FINALIZED'
  const claimTxHash = isFinalized ? (row?.claimTxHash ?? undefined) : undefined
  const settlement = row?.settlement
  const settlementTxHash =
    settlement && !settlement.failed ? settlement.txHash : undefined
  const unstakeMined = withdrawStatus === WithdrawStatus.WITHDRAW_TX_CONFIRMED
  // `needsCooldown` defaults to true while `useIsCooldownEligible` loads (the
  // common case); `cooldownElapsed` asks whether the timer has finished.
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
    status: resolveReceiveStatus({
      awaitingClaim: !!row && needsManualClaim(row),
      crossChainInFlight: unstakeMined && (!needsCooldown || cooldownElapsed),
      isFinalized,
      settlement,
      settlementTxHash,
    }),
    txHash: deliveryHash,
  }
}

const FAILED_STATUSES: WithdrawStatusType[] = [
  WithdrawStatus.APPROVAL_TX_FAILED,
  WithdrawStatus.WITHDRAW_TX_FAILED,
]

// Adapts the recover step's local state to the shared ladder, mirroring
// `resolveReceiveStatus`; auto-recover (no manual action) rests at PROGRESS.
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

// Builds the `data:` argument for `useEstimateGas`. Module-level so the
// component doesn't pay the branching tax for this conditional encode.
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

// Drawer opens after the user signs the first wallet prompt (approval if
// needed, otherwise the redeem).
export const ReviewWithdraw = function ({ onClose }: Props) {
  const { input, pool, selectedAsset, withdrawOperation } = usePoolForm()
  const t = useTranslations('hemi-earn.pool.drawer')
  const chainId = selectedAsset.token.chainId
  const chain = useChain(chainId)
  const { address } = useAccount()

  // Shared subscription with the layout-mounted watcher; lets the new
  // receive step flip to COMPLETED off the subgraph status.
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

  const { data: isCooldownEligible } = useIsCooldownEligible({
    account: address,
    stakingVault: pool.stakingVault,
  })
  // Pool-level cooldown duration drives the static "Wait for the N-day
  // cooldown period" copy while we don't yet have a request to query
  // (pre-sign / pre-indexed).
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

  // Input is in share-token units (svetBTC); the Router burns shares
  // directly. `assetsOutMin` is derived from the asset preview below.
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

    // Mirror the deposit review: the LayerZero fee is paid as msg.value on the
    // same `requestRedeem` tx, so we sum it into the withdraw line rather than
    // showing a fictitious separate transaction.
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
      postAction: deriveCooldownPostAction({
        cooldownDurationSec,
        cooldownRemainingSec,
        isCooldownEligible,
        subgraphStatus: subgraphRow?.status,
        t,
        unstakeMined: withdrawStatus === WithdrawStatus.WITHDRAW_TX_CONFIRMED,
      }),
      status: statusMap[withdrawStatus] ?? ProgressStatus.NOT_READY,
      txHash: withdrawOperation?.transactionHash,
    }
  }

  const addRecoverStep = function (): StepPropsWithoutPosition {
    const settlementTxHash =
      settlement && !settlement.failed ? settlement.txHash : undefined
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
        settlementFailed: settlement?.failed ?? false,
        settlementTxHash,
      }),
      txHash: deliveryHash,
    }
  }

  const getCallToAction = function () {
    if (FAILED_STATUSES.includes(withdrawStatus)) {
      return <RetryWithdraw />
    }
    // Auto-claim off: the user signs the claim here once the Agent delivers the
    // asset back to the Router (FULFILLED).
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
    // The redeem was cancelled and the shares are back on the Router; the user
    // signs the recover to pull them to their wallet.
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
    steps.push(
      settledRow && isRecoverPath(settledRow)
        ? addRecoverStep()
        : buildReceiveStep({
            chainId,
            cooldownRemainingSec,
            isCooldownEligible,
            receiveToken: selectedAsset.token,
            row: settledRow,
            t,
            withdrawStatus,
          }),
    )
    return steps
  }

  return (
    <Operation
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
