'use client'

import { ChainLabel } from 'components/reviewOperation/chainLabel'
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
import { type ReactNode } from 'react'
import { type EvmToken } from 'types/token'
import { getNativeToken } from 'utils/nativeToken'
import { secondsToDays, secondsToHours, secondsToWholeDays } from 'utils/time'
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
import { useRequestDetails } from '../../../../_hooks/useRequestDetails'
import { hashesMatch } from '../../../../_utils'
import { usePoolForm } from '../../_context/poolFormContext'
import { useAssetsToShares } from '../../_hooks/useAssetsToShares'
import { useEarnCooldownRemaining } from '../../_hooks/useEarnCooldownRemaining'
import { useQuoteRedeem } from '../../_hooks/useQuoteRedeem'
import {
  WithdrawStatus,
  type WithdrawStatusType,
} from '../../_types/operations'

import { RetryWithdraw } from './retryWithdraw'

type Props = {
  onClose: VoidFunction
}

type CooldownPostAction = {
  description: ReactNode
  status: ProgressStatusType
}

type CooldownInputs = {
  cooldownDurationSec: number | undefined
  cooldownRemainingSec: number | undefined
  isCooldownEligible: boolean | undefined
  subgraphStatus: string | undefined
  t: ReturnType<typeof useTranslations<'hemi-earn.pool.drawer'>>
  unstakeMined: boolean
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
  // Only CLAIMED actually delivers the underlying. RECOVERED returns
  // shares to the user (not the asset this step is labeled with), so the
  // step never flips COMPLETED in that case — recovery UX is handled
  // outside this drawer (tracked in its own follow-up).
  const claimTxHash =
    subgraphRow?.status === 'CLAIMED'
      ? subgraphRow.claimTxHash ?? undefined
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

// Subgraph statuses past the cross-chain handoff — the Vetro Agent has
// acted on the request, so per-request reads like `getRequestDetails`
// have valid data to return. PENDING is excluded because the Agent
// hasn't observed yet, and the contract may revert or return zeros.
const AGENT_OBSERVED_STATUSES = ['FULFILLED', 'CLAIMED', 'RECOVERED'] as const

const hasAgentObserved = (subgraphStatus: string | undefined) =>
  subgraphStatus !== undefined &&
  (AGENT_OBSERVED_STATUSES as readonly string[]).includes(subgraphStatus)

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

// Decides what (if anything) to render under the Unstake step as a clock
// sub-step. Pure function so the component's complexity stays low.
//
// Mirrors the tunnel's wait-step pattern (e.g. `reviewEvmWithdrawal`):
// the sub-step stays mounted across its whole lifecycle (NOT_READY →
// PROGRESS → COMPLETED) so the user keeps a visible milestone even
// after the wait period elapses. The only case we hide it entirely is
// when the user simply doesn't have a cooldown (whitelist / disabled).
function deriveCooldownPostAction({
  cooldownDurationSec,
  cooldownRemainingSec,
  isCooldownEligible,
  subgraphStatus,
  t,
  unstakeMined,
}: CooldownInputs): CooldownPostAction | undefined {
  if (isCooldownEligible === false) return undefined
  // The cooldown is effectively over once any of:
  //   - the local timer elapsed
  //   - the subgraph row reached CLAIMED (auto-claim fired the moment
  //     the cooldown matured)
  //   - the subgraph row reached RECOVERED (cancel/recovery ended the
  //     cooldown early)
  // Keep the sub-step visible as a COMPLETED milestone — without this,
  // an auto-claim landing seconds after the timer hits zero would make
  // the sub-step disappear right when the user expects to see it tick
  // over to "done".
  const cooldownOver =
    cooldownRemainingSec === 0 ||
    subgraphStatus === 'CLAIMED' ||
    subgraphStatus === 'RECOVERED'
  if (cooldownOver) {
    return {
      description: t('cooldown-ended'),
      status: ProgressStatus.COMPLETED,
    }
  }
  // Duration still loading — render nothing for now; the postAction
  // shows up once the on-chain read settles.
  if (cooldownDurationSec === undefined) return undefined

  const days = secondsToWholeDays(cooldownDurationSec)

  if (!unstakeMined) {
    return {
      description: t('wait-cooldown-pending', { days }),
      status: ProgressStatus.NOT_READY,
    }
  }

  if (cooldownRemainingSec === undefined) {
    return {
      description: t('wait-cooldown-pending', { days }),
      status: ProgressStatus.PROGRESS,
    }
  }

  // Sub-hour remaining: avoid the misleading "0h" by collapsing to a
  // generic "less than an hour" copy. Tick interval is at minute
  // resolution, so showing a precise minute countdown would lie about
  // freshness; the shorter copy is honest about where we are.
  if (cooldownRemainingSec < 3600) {
    return {
      description: t('wait-cooldown-countdown-soon'),
      status: ProgressStatus.PROGRESS,
    }
  }

  const remainingDays = Math.floor(secondsToDays(cooldownRemainingSec))
  const remainingHours = Math.floor(
    secondsToHours(cooldownRemainingSec - remainingDays * 86400),
  )
  return {
    description: t('wait-cooldown-countdown', {
      days: remainingDays,
      hours: remainingHours,
    }),
    status: ProgressStatus.PROGRESS,
  }
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
      hashesMatch(r.initiateTxHash, withdrawOperation?.transactionHash),
  )

  const { data: isCooldownEligible } = useIsCooldownEligible({
    account: address,
    shareAddress: pool.shareAddress,
  })
  // Pool-level cooldown duration drives the static "Wait for the N-day
  // cooldown period" copy while we don't yet have a request to query
  // (pre-sign / pre-indexed).
  const { data: cooldownDurationSec } = useCooldownDuration({
    shareAddress: pool.shareAddress,
  })
  // Per-request `claimableAt` from Ethereum is the authoritative cooldown
  // maturity timestamp — set by the Vetro Agent at LayerZero-observation
  // time, never drifts after that. We only query it once the subgraph
  // confirms the Agent has acted (FULFILLED+); before that the Vetro
  // contract may revert or return a zero struct, and caching either
  // outcome under `staleTime: Infinity` would poison the countdown.
  const { data: requestDetails } = useRequestDetails({
    requestId: hasAgentObserved(subgraphRow?.status)
      ? subgraphRow?.requestId
      : undefined,
    shareAddress: pool.shareAddress,
  })
  const cooldownRemainingSec = useEarnCooldownRemaining(
    requestDetails?.claimableAt,
  )

  const withdrawStatus =
    withdrawOperation?.status ?? WithdrawStatus.APPROVAL_TX_COMPLETED

  const amount = parseTokenUnits(input, selectedAsset.token)
  const assetsOutMin =
    amount > BigInt(0) ? applySlippage(amount, REDEEM_SLIPPAGE_BPS) : BigInt(0)
  const routerAddress = getHemiEarnRouterAddress()

  const { data: { shares } = { shares: BigInt(0) } } = useAssetsToShares({
    amount,
    assetAddress: selectedAsset.address,
    shareAddress: pool.shareAddress,
  })

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
    account: address,
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
        <ChainLabel
          active={withdrawStatus === WithdrawStatus.APPROVAL_TX_PENDING}
          chainId={chainId}
          label={t('approving', { symbol: pool.shareToken.symbol })}
        />
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
