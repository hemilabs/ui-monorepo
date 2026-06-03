'use client'

import { AddTokenToWallet } from 'components/addTokenToWallet'
import { ChainLabel } from 'components/reviewOperation/chainLabel'
import { Operation } from 'components/reviewOperation/operation'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { encodeRequestDeposit } from 'hemi-earn-actions/actions'
import { useChain } from 'hooks/useChain'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useTranslations } from 'next-intl'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { formatUnits } from 'viem'
import { useAccount, useEstimateGas } from 'wagmi'

import { usePoolForm } from '../../_context/poolFormContext'
import { useQuoteDeposit } from '../../_hooks/useQuoteDeposit'
import { DepositStatus, type DepositStatusType } from '../../_types/operations'

import { RetryDeposit } from './retryDeposit'

type Props = {
  onClose: VoidFunction
}

export const ReviewDeposit = function ({ onClose }: Props) {
  const { depositOperation, input, pool, selectedAsset } = usePoolForm()
  const t = useTranslations('hemi-earn.pool.drawer')
  const tCommon = useTranslations('common')
  const chainId = selectedAsset.token.chainId
  const chain = useChain(chainId)
  const { address } = useAccount()

  const depositStatus =
    depositOperation?.status ?? DepositStatus.APPROVAL_TX_COMPLETED

  const amount = parseTokenUnits(input, selectedAsset.token)
  const routerAddress = getHemiEarnRouterAddress()

  const { fees: approvalGasFees, isError: isApprovalGasFeesError } =
    useEstimateApproveErc20Fees({
      amount,
      enabled: [
        DepositStatus.APPROVAL_TX_FAILED,
        DepositStatus.APPROVAL_TX_PENDING,
      ].includes(depositStatus),
      spender: routerAddress,
      token: selectedAsset.token,
    })

  const { data: quote } = useQuoteDeposit({
    amount,
    asset: selectedAsset.address,
    shareAddress: pool.shareAddress,
  })

  const { data: depositGasUnits, isError: isDepositGasUnitsError } =
    useEstimateGas({
      data:
        address && quote
          ? encodeRequestDeposit({
              amount,
              asset: selectedAsset.address,
              callbackFee: quote.callbackFee,
              operator: address,
              receiver: address,
            })
          : undefined,
      query: { enabled: !!address && amount > BigInt(0) && !!quote },
      to: routerAddress,
      value: quote?.nativeFee,
    })

  const { fees: depositGasFees, isError: isDepositGasFeesError } =
    useEstimateFees({
      chainId,
      gasUnits: depositGasUnits,
      isGasUnitsError: isDepositGasUnitsError,
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
      DepositStatus.APPROVAL_TX_FAILED,
      DepositStatus.APPROVAL_TX_PENDING,
    ].includes(depositStatus)

    const statusMap: Partial<Record<DepositStatusType, ProgressStatusType>> = {
      [DepositStatus.APPROVAL_TX_FAILED]: ProgressStatus.FAILED,
      [DepositStatus.APPROVAL_TX_PENDING]: ProgressStatus.PROGRESS,
    }

    const getStatus = function () {
      if (depositStatus === undefined) {
        return ProgressStatus.COMPLETED
      }
      return statusMap[depositStatus] ?? ProgressStatus.COMPLETED
    }

    return {
      description: (
        <ChainLabel
          active={depositStatus === DepositStatus.APPROVAL_TX_PENDING}
          chainId={chainId}
          label={t('approving', { symbol: selectedAsset.token.symbol })}
        />
      ),
      explorerChainId: chainId,
      fees: getStepFees({
        fee: approvalGasFees,
        isError: isApprovalGasFeesError,
        show: showFees,
      }),
      status: getStatus(),
      txHash: depositOperation?.approvalTxHash,
    }
  }

  const addDepositStep = function (): StepPropsWithoutPosition {
    const statusMap: Record<DepositStatusType, ProgressStatusType> = {
      [DepositStatus.APPROVAL_TX_PENDING]: ProgressStatus.NOT_READY,
      [DepositStatus.APPROVAL_TX_FAILED]: ProgressStatus.NOT_READY,
      [DepositStatus.APPROVAL_TX_COMPLETED]: ProgressStatus.READY,
      [DepositStatus.DEPOSIT_TX_PENDING]: ProgressStatus.PROGRESS,
      [DepositStatus.DEPOSIT_TX_FAILED]: ProgressStatus.FAILED,
      [DepositStatus.DEPOSIT_TX_CONFIRMED]: ProgressStatus.COMPLETED,
    }

    const showFees = [
      DepositStatus.APPROVAL_TX_COMPLETED,
      DepositStatus.DEPOSIT_TX_PENDING,
      DepositStatus.DEPOSIT_TX_FAILED,
    ].includes(depositStatus)

    // Roll the LayerZero fee into the deposit step's gas line. Splitting it
    // into its own step would imply a separate signature/transaction, which
    // isn't the case — `msg.value = nativeFee` is paid as part of the same
    // `requestDeposit` tx.
    const depositLineTotal = depositGasFees + layerZeroFee

    return {
      description: (
        <ChainLabel
          active={depositStatus === DepositStatus.DEPOSIT_TX_PENDING}
          chainId={chainId}
          label={t('deposit-token', { symbol: selectedAsset.token.symbol })}
        />
      ),
      explorerChainId: chainId,
      fees: getStepFees({
        fee: depositLineTotal,
        isError: isDepositGasFeesError,
        show: showFees,
      }),
      status: statusMap[depositStatus] ?? ProgressStatus.NOT_READY,
      txHash: depositOperation?.transactionHash,
    }
  }

  // TODO(design): append a third "Cross-chain delivery" step after the
  // deposit step. Confirmed with the designer — same step needs to be
  // mirrored in `historicalDepositReview.tsx` (and the withdraw drawers
  // once that flow lands).
  //
  // Semantics:
  //   - DEPOSIT_TX_CONFIRMED + subgraph PENDING            → PROGRESS
  //   - subgraph FULFILLED + tx.automatic === true         → PROGRESS
  //   - subgraph FULFILLED + tx.automatic === false        → CTA — render
  //     a "Claim deposit" button; the user signs the claim tx themselves.
  //     Needs its own fee line via `getStepFees`.
  //   - subgraph CLAIMED                                   → COMPLETED
  //     with `claimTxHash`
  //   - subgraph CANCELLED                                 → FAILED
  //     (recover CTA on automatic=false)
  //
  // The subgraph status isn't piped into this component today; the watcher
  // in `useEarnDeliveryWatcher` already polls it and could expose the row
  // through the local store or a derived hook.
  const getSteps = function () {
    const steps: StepPropsWithoutPosition[] = []
    if (depositOperation?.approvalTxHash) {
      steps.push(addApprovalStep())
    }
    steps.push(addDepositStep())
    return steps
  }

  const getCallToAction = function (status: DepositStatusType) {
    if (
      [
        DepositStatus.APPROVAL_TX_FAILED,
        DepositStatus.DEPOSIT_TX_FAILED,
      ].includes(status)
    ) {
      return <RetryDeposit />
    }
    if (status === DepositStatus.DEPOSIT_TX_CONFIRMED) {
      return (
        <AddTokenToWallet
          labels={{
            error: tCommon('add-token-to-wallet-error'),
            idle: tCommon('add-token-to-wallet-idle'),
            pending: tCommon('add-token-to-wallet-pending'),
            success: tCommon('add-token-to-wallet-success'),
          }}
          token={pool.shareToken}
        />
      )
    }
    return null
  }

  return (
    <Operation
      amount={amount.toString()}
      callToAction={getCallToAction(depositStatus)}
      heading={t('deposit.heading')}
      onClose={onClose}
      steps={getSteps()}
      subheading={t('deposit.subheading')}
      token={selectedAsset.token}
    />
  )
}
