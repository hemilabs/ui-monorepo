'use client'

import { Operation } from 'components/reviewOperation/operation'
import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { useChain } from 'hooks/useChain'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useL1StandardBridgeAddress } from 'hooks/useL1StandardBridgeAddress'
import { useToken } from 'hooks/useToken'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { EvmToken } from 'types/token'
import {
  EvmDepositOperation,
  EvmDepositStatus,
  ExpectedWaitTimeMinutesGetFundsHemi,
} from 'types/tunnel'
import { getNativeToken, isNativeToken } from 'utils/nativeToken'
import { formatUnits } from 'viem'

import { useEstimateDepositFees } from '../../_hooks/useEstimateDepositFees'
import { RetryEvmDeposit } from '../retryEvmDeposit'

import { AddTokenToWallet } from './addTokenToWallet'
import { ChainIcon } from './chainIcon'
import { ChainLabel } from './chainLabel'

const getCallToAction = (deposit: EvmDepositOperation) =>
  [
    EvmDepositStatus.APPROVAL_TX_FAILED,
    EvmDepositStatus.DEPOSIT_TX_FAILED,
  ].includes(deposit.status) ? (
    <RetryEvmDeposit deposit={deposit} />
  ) : null

type Props = {
  deposit: EvmDepositOperation
  onClose: () => void
}

const ReviewContent = function ({
  deposit,
  fromToken,
  onClose,
  toToken,
}: Props & { fromToken: EvmToken; toToken: EvmToken }) {
  const depositStatus = deposit.status ?? EvmDepositStatus.DEPOSIT_TX_CONFIRMED

  const fromChain = useChain(deposit.l1ChainId)
  const toChain = useChain(deposit.l2ChainId)

  const l1StandardBridgeAddress = useL1StandardBridgeAddress(fromToken.chainId)

  const { fees: approvalTokenGasFees, isError: isApprovalTokenGasFeesError } =
    useEstimateApproveErc20Fees({
      amount: BigInt(deposit.amount),
      enabled: [
        EvmDepositStatus.APPROVAL_TX_FAILED,
        EvmDepositStatus.APPROVAL_TX_PENDING,
      ].includes(depositStatus),
      spender: l1StandardBridgeAddress,
      token: fromToken,
    })

  const { fees: depositGasFees, isError: isDepositGasFeesError } =
    useEstimateDepositFees({
      amount: BigInt(deposit.amount),
      enabled: [
        EvmDepositStatus.APPROVAL_TX_COMPLETED,
        EvmDepositStatus.DEPOSIT_TX_PENDING,
        EvmDepositStatus.DEPOSIT_TX_FAILED,
      ].includes(depositStatus),
      fromToken,
      toToken,
    })

  const t = useTranslations('tunnel-page.review-deposit')
  const tCommon = useTranslations('common')

  const steps: StepPropsWithoutPosition[] = []

  const getApprovalStep = (): StepPropsWithoutPosition => ({
    description: (
      <ChainLabel
        active={depositStatus === EvmDepositStatus.APPROVAL_TX_PENDING}
        chainId={fromChain.id}
        label={t('approve-on', { networkName: fromChain.name })}
      />
    ),
    explorerChainId: deposit.l1ChainId,
    fees:
      depositStatus === EvmDepositStatus.APPROVAL_TX_PENDING
        ? {
            amount: formatUnits(
              approvalTokenGasFees,
              fromChain.nativeCurrency.decimals,
            ),
            isError: isApprovalTokenGasFeesError,
            token: getNativeToken(fromChain.id),
          }
        : undefined,
    status:
      depositStatus >= EvmDepositStatus.APPROVAL_TX_COMPLETED
        ? ProgressStatus.COMPLETED
        : ProgressStatus.PROGRESS,
    txHash: deposit.approvalTxHash,
  })

  const getDepositStep = function (): StepPropsWithoutPosition {
    const statusMap = {
      [EvmDepositStatus.APPROVAL_TX_COMPLETED]: ProgressStatus.READY,
      [EvmDepositStatus.APPROVAL_TX_PENDING]: ProgressStatus.NOT_READY,
      [EvmDepositStatus.DEPOSIT_TX_CONFIRMED]: ProgressStatus.COMPLETED,
      [EvmDepositStatus.DEPOSIT_TX_FAILED]: ProgressStatus.FAILED,
      [EvmDepositStatus.DEPOSIT_TX_PENDING]: ProgressStatus.PROGRESS,
      [EvmDepositStatus.DEPOSIT_RELAYED]: ProgressStatus.COMPLETED,
    }

    const postStatusMap = {
      [EvmDepositStatus.DEPOSIT_TX_CONFIRMED]: ProgressStatus.PROGRESS,
      [EvmDepositStatus.DEPOSIT_RELAYED]: ProgressStatus.COMPLETED,
    }
    return {
      description: (
        <ChainLabel
          active={depositStatus === EvmDepositStatus.DEPOSIT_TX_PENDING}
          chainId={fromChain.id}
          label={t('start-on', { networkName: fromChain.name })}
        />
      ),
      explorerChainId: deposit.l1ChainId,
      fees: [
        EvmDepositStatus.APPROVAL_TX_COMPLETED,
        EvmDepositStatus.DEPOSIT_TX_PENDING,
        EvmDepositStatus.DEPOSIT_TX_FAILED,
      ].includes(depositStatus)
        ? {
            amount: formatUnits(
              depositGasFees,
              fromChain.nativeCurrency.decimals,
            ),
            isError: isDepositGasFeesError,
            token: getNativeToken(fromChain.id),
          }
        : undefined,
      postAction: {
        description: tCommon('wait-minutes', {
          minutes: ExpectedWaitTimeMinutesGetFundsHemi,
        }),
        status: postStatusMap[depositStatus],
      },
      status: statusMap[depositStatus],
      txHash: deposit.transactionHash,
    }
  }

  const getFundsHemiStep = (): StepPropsWithoutPosition => ({
    description: (
      <div className="flex items-center gap-x-2">
        <ChainIcon chainId={toChain.id} />
        <span className="text-sm font-normal text-neutral-500">
          {t('get-your-funds-on', { networkName: toChain.name })}
        </span>
      </div>
    ),
    explorerChainId: deposit.l2ChainId,
    status:
      depositStatus === EvmDepositStatus.DEPOSIT_RELAYED
        ? ProgressStatus.COMPLETED
        : ProgressStatus.NOT_READY,
    txHash: deposit.l2TransactionHash,
  })

  // Show the approval only if it's a not native token and there is a approval.
  // Note that for past re-sync transactions, the approvalHash won't be available,
  // as we can't see if a user has approved a token before the actual deposit (they are different transactions
  // and for the time being it's not worth scanning the user's wallet)
  if (!isNativeToken(fromToken) && deposit.approvalTxHash) {
    steps.push(getApprovalStep())
  }

  steps.push(getDepositStep())
  steps.push(getFundsHemiStep())

  const addToken = function () {
    // Only show the option to add the token if the deposit is either completed,
    // or the user is waiting for the tokens to be minted on Hemi.
    if (
      ![
        EvmDepositStatus.DEPOSIT_TX_CONFIRMED,
        EvmDepositStatus.DEPOSIT_RELAYED,
      ].includes(depositStatus)
    ) {
      return null
    }
    return <AddTokenToWallet token={toToken} />
  }

  return (
    <Operation
      amount={deposit.amount}
      bottomSection={addToken()}
      callToAction={getCallToAction(deposit)}
      heading={t('review-deposit')}
      onClose={onClose}
      steps={steps}
      subheading={
        depositStatus === EvmDepositStatus.DEPOSIT_RELAYED
          ? t('your-deposit-is-complete')
          : t('deposit-on-its-way')
      }
      token={fromToken}
    />
  )
}

export const ReviewEvmDeposit = function ({ deposit, onClose }: Props) {
  const { data: fromToken } = useToken({
    address: deposit.l1Token,
    chainId: deposit.l1ChainId,
  })

  const { data: toToken } = useToken({
    address: deposit.l2Token,
    chainId: deposit.l2ChainId,
  })

  const tokensLoaded = !!fromToken && !!toToken

  return tokensLoaded ? (
    <ReviewContent
      deposit={deposit}
      fromToken={fromToken as EvmToken}
      onClose={onClose}
      toToken={toToken as EvmToken}
    />
  ) : (
    <Skeleton className="h-full" />
  )
}
