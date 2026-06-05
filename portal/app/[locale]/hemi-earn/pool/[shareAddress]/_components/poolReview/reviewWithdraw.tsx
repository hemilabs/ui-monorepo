'use client'

import { ChainLabel } from 'components/reviewOperation/chainLabel'
import { Operation } from 'components/reviewOperation/operation'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { encodeRequestRedeem } from 'hemi-earn-actions/actions'
import { useChain } from 'hooks/useChain'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import { useTranslations } from 'next-intl'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { type Address, formatUnits } from 'viem'
import { useAccount, useEstimateGas } from 'wagmi'

import {
  REDEEM_SLIPPAGE_BPS,
  applySlippage,
} from '../../../../_constants/slippage'
import { usePoolForm } from '../../_context/poolFormContext'
import { useAssetsToShares } from '../../_hooks/useAssetsToShares'
import { useQuoteRedeem } from '../../_hooks/useQuoteRedeem'
import {
  WithdrawStatus,
  type WithdrawStatusType,
} from '../../_types/operations'

import { RetryWithdraw } from './retryWithdraw'

type Props = {
  onClose: VoidFunction
}

export const ReviewWithdraw = function ({ onClose }: Props) {
  const { input, pool, selectedAsset, withdrawOperation } = usePoolForm()
  const t = useTranslations('hemi-earn.pool.drawer')
  const chainId = selectedAsset.token.chainId
  const chain = useChain(chainId)
  const { address } = useAccount()

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
      data:
        address && quote && shares > BigInt(0)
          ? encodeRequestRedeem({
              asset: selectedAsset.address,
              assetsOutMin,
              callbackFee: quote.callbackFee,
              isInstant: quote.isInstant,
              operator: address,
              receiver: address,
              shares,
            })
          : undefined,
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

    const getStatus = function () {
      if (withdrawStatus === undefined) {
        return ProgressStatus.COMPLETED
      }
      return statusMap[withdrawStatus] ?? ProgressStatus.COMPLETED
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
      status: getStatus(),
      txHash: withdrawOperation?.approvalTxHash,
    }
  }

  const addWithdrawStep = function (): StepPropsWithoutPosition {
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
        <ChainLabel
          active={withdrawStatus === WithdrawStatus.WITHDRAW_TX_PENDING}
          chainId={chainId}
          label={t('withdraw-token', { symbol: selectedAsset.token.symbol })}
        />
      ),
      explorerChainId: chainId,
      fees: getStepFees({
        fee: withdrawLineTotal,
        isError: isWithdrawGasFeesError,
        show: showFees,
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
    steps.push(addWithdrawStep())
    return steps
  }

  const getCallToAction = (status: WithdrawStatusType) =>
    [
      WithdrawStatus.APPROVAL_TX_FAILED,
      WithdrawStatus.WITHDRAW_TX_FAILED,
    ].includes(status) ? (
      <RetryWithdraw />
    ) : null

  return (
    <Operation
      amount={amount.toString()}
      callToAction={getCallToAction(withdrawStatus)}
      heading={t('withdraw.heading')}
      onClose={onClose}
      steps={getSteps()}
      subheading={t('withdraw.subheading')}
      token={selectedAsset.token}
    />
  )
}
