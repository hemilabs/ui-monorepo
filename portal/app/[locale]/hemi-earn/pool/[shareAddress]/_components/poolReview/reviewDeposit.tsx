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

import {
  DEPOSIT_SLIPPAGE_BPS,
  applySlippage,
} from '../../../../_constants/slippage'
import { useEarnTransactionsQuery } from '../../../../_hooks/useEarnTransactionsQuery'
import { SparkleIcon } from '../../../../_icons/sparkleIcon'
import { getTerminalDeliveryTxHash, hashesMatch } from '../../../../_utils'
import { usePoolForm } from '../../_context/poolFormContext'
import { useDepositShares } from '../../_hooks/useDepositShares'
import { useQuoteDeposit } from '../../_hooks/useQuoteDeposit'
import { DepositStatus, type DepositStatusType } from '../../_types/operations'

import { RetryDeposit } from './retryDeposit'

type Props = {
  onClose: VoidFunction
}

// Drawer opens after the user signs the first wallet prompt (approval if
// needed, otherwise the deposit).
export const ReviewDeposit = function ({ onClose }: Props) {
  const { depositOperation, input, pool, selectedAsset } = usePoolForm()
  const t = useTranslations('hemi-earn.pool.drawer')
  const tCommon = useTranslations('common')
  const chainId = selectedAsset.token.chainId
  const chain = useChain(chainId)
  const { address } = useAccount()

  // Shared subscription with the layout-mounted watcher; lets the new
  // get-share-tokens step flip to COMPLETED off the subgraph status.
  const { data: subgraphRows = [] } = useEarnTransactionsQuery()
  const subgraphRow = subgraphRows.find(r =>
    hashesMatch(r.initiateTxHash, depositOperation?.transactionHash),
  )

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

  const { data: shares } = useDepositShares({
    amount,
    asset: selectedAsset.address,
    shareAddress: pool.shareAddress,
  })

  const sharesOutMin = shares
    ? applySlippage(shares, DEPOSIT_SLIPPAGE_BPS)
    : BigInt(0)

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
              sharesOutMin,
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

  const addApprovalStep = function () {
    const showFees = [
      DepositStatus.APPROVAL_TX_FAILED,
      DepositStatus.APPROVAL_TX_PENDING,
    ].includes(depositStatus)

    const statusMap: Partial<Record<DepositStatusType, ProgressStatusType>> = {
      [DepositStatus.APPROVAL_TX_FAILED]: ProgressStatus.FAILED,
      [DepositStatus.APPROVAL_TX_PENDING]: ProgressStatus.PROGRESS,
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
      status: statusMap[depositStatus] ?? ProgressStatus.COMPLETED,
      txHash: depositOperation?.approvalTxHash,
    }
  }

  const addStakeStep = function () {
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

    const status = statusMap[depositStatus] ?? ProgressStatus.NOT_READY
    return {
      description: (
        <div className="flex items-center gap-x-2">
          <SparkleIcon />
          <span>
            {t('stake-token', { symbol: selectedAsset.token.symbol })}
          </span>
        </div>
      ),
      explorerChainId: chainId,
      fees: getStepFees({
        fee: depositLineTotal,
        isError: isDepositGasFeesError,
        show: showFees,
      }),
      status,
      txHash: depositOperation?.transactionHash,
    }
  }

  const addGetShareTokensStep = function () {
    const terminalHash = getTerminalDeliveryTxHash(subgraphRow)

    const getStatus = function (): ProgressStatusType {
      if (terminalHash) return ProgressStatus.COMPLETED
      if (depositStatus === DepositStatus.DEPOSIT_TX_CONFIRMED) {
        return ProgressStatus.PROGRESS
      }
      return ProgressStatus.NOT_READY
    }

    return {
      description: <span>{t('get-share-tokens')}</span>,
      status: getStatus(),
      txHash: terminalHash,
    }
  }

  const getCallToAction = function () {
    if (
      [
        DepositStatus.APPROVAL_TX_FAILED,
        DepositStatus.DEPOSIT_TX_FAILED,
      ].includes(depositStatus)
    ) {
      return <RetryDeposit />
    }
    // Shares only land in the user's wallet once cross-chain delivery
    // completes (subgraph CLAIMED). Showing the "Add token" CTA before
    // that points the wallet at a token with no balance and confuses
    // wallets that gate metadata reads on a non-zero balance.
    if (subgraphRow?.status === 'CLAIMED') {
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

  const getSteps = function () {
    const steps: StepPropsWithoutPosition[] = []
    if (depositOperation?.approvalTxHash) {
      steps.push(addApprovalStep())
    }
    steps.push(addStakeStep())
    steps.push(addGetShareTokensStep())
    return steps
  }

  return (
    <Operation
      amount={depositOperation?.amountIn ?? amount.toString()}
      callToAction={getCallToAction()}
      heading={t('deposit.heading')}
      onClose={onClose}
      steps={getSteps()}
      subheading={t('deposit.subheading')}
      token={selectedAsset.token}
    />
  )
}
