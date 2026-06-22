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
  REDEEM_SLIPPAGE_BPS,
  applySlippage,
} from '../../../../_constants/slippage'
import { useCooldownDuration } from '../../../../_hooks/useCooldownDuration'
import { useEarnTransactionsQuery } from '../../../../_hooks/useEarnTransactionsQuery'
import { useIsCooldownEligible } from '../../../../_hooks/useIsCooldownEligible'
import { hashesMatch } from '../../../../_utils'
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

// Maps the local withdraw status, subgraph row, and cooldown state to the
// receive step's progress + terminal hash. Module-level so the component
// stays under the complexity threshold.
//
// The step only flips to PROGRESS once the user is actually waiting on the
// remote claim — either because they're whitelisted (no cooldown) or
// because the cooldown timer has elapsed. Otherwise it stays NOT_READY so
// the drawer doesn't show two simultaneous spinners (one on the cooldown
// sub-step, one here).
function buildReceiveStep({
  cooldownRemainingSec,
  isCooldownEligible,
  receiveToken,
  subgraphRow,
  t,
  withdrawStatus,
}: {
  cooldownRemainingSec: number | undefined
  isCooldownEligible: boolean | undefined
  receiveToken: EvmToken
  subgraphRow:
    | {
        claimTxHash: Hash | null
        recoverTxHash: Hash | null
        status: string
      }
    | undefined
  t: ReturnType<typeof useTranslations<'hemi-earn.pool.drawer'>>
  withdrawStatus: WithdrawStatusType
}): StepPropsWithoutPosition {
  // Only FINALIZED actually delivers the underlying. RECOVERED returns
  // shares to the user (not the asset this step is labeled with), so the
  // step never flips COMPLETED in that case — recovery UX is handled
  // outside this drawer (tracked in its own follow-up).
  const claimTxHash =
    subgraphRow?.status === 'FINALIZED'
      ? (subgraphRow.claimTxHash ?? undefined)
      : undefined
  const unstakeMined = withdrawStatus === WithdrawStatus.WITHDRAW_TX_CONFIRMED
  // Two distinct questions, kept as separate predicates so each reads
  // for what it actually asks:
  //   - `needsCooldown`: does this user have to wait at all? Defaults
  //     to true while `useIsCooldownEligible` is loading — cooldown
  //     active is the normal case; whitelist / disabled-cooldown are
  //     the exception.
  //   - `cooldownElapsed`: for users that DO wait, has the timer
  //     finished?
  const needsCooldown = isCooldownEligible !== false
  const cooldownElapsed = cooldownRemainingSec === 0
  const status: ProgressStatusType = claimTxHash
    ? ProgressStatus.COMPLETED
    : unstakeMined && (!needsCooldown || cooldownElapsed)
      ? ProgressStatus.PROGRESS
      : ProgressStatus.NOT_READY
  return {
    description: (
      <div className="flex items-center gap-x-2">
        <TokenLogo size="small" token={receiveToken} />
        <span>{t('receive-token', { symbol: receiveToken.symbol })}</span>
      </div>
    ),
    status,
    txHash: claimTxHash,
  }
}

const FAILED_STATUSES: WithdrawStatusType[] = [
  WithdrawStatus.APPROVAL_TX_FAILED,
  WithdrawStatus.WITHDRAW_TX_FAILED,
]

const renderRetryCta = (status: WithdrawStatusType) =>
  FAILED_STATUSES.includes(status) ? <RetryWithdraw /> : null

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

  const getSteps = function () {
    const steps: StepPropsWithoutPosition[] = []
    if (needsApproval || withdrawOperation?.approvalTxHash) {
      steps.push(addApprovalStep())
    }
    steps.push(addUnstakeStep())
    steps.push(
      buildReceiveStep({
        cooldownRemainingSec,
        isCooldownEligible,
        receiveToken: selectedAsset.token,
        subgraphRow,
        t,
        withdrawStatus,
      }),
    )
    return steps
  }

  return (
    <Operation
      amount={withdrawOperation?.amountIn ?? shares.toString()}
      callToAction={renderRetryCta(withdrawStatus)}
      heading={t('withdraw.heading')}
      onClose={onClose}
      steps={getSteps()}
      subheading={t('withdraw.subheading')}
      token={pool.shareToken}
    />
  )
}
