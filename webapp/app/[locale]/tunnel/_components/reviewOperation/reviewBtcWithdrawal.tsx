'use client'

import { useChain } from 'hooks/useChain'
import { useEstimateBtcWithdrawFees } from 'hooks/useEstimateBtcWithdrawFees'
import { useToken } from 'hooks/useToken'
import { useTranslations } from 'next-intl'
import { useContext } from 'react'
import Skeleton from 'react-loading-skeleton'
import { EvmToken } from 'types/token'
import { BtcWithdrawStatus, ToBtcWithdrawOperation } from 'types/tunnel'
import { formatUnits } from 'viem'

import {
  EvmToBtcWithdrawalContext,
  EvmToBtcWithdrawalProvider,
} from '../../_context/evmToBtcWithdrawalContext'
import { ChallengeBtcWithdrawal } from '../challengeBtcWithdrawal'
import { RetryBtcWithdraw } from '../retryBtcWithdraw'

import { Operation } from './operation'
import { ProgressStatus } from './progressStatus'
import { type StepPropsWithoutPosition } from './step'

const getCallToAction = function (withdrawal: ToBtcWithdrawOperation) {
  switch (withdrawal.status) {
    case BtcWithdrawStatus.WITHDRAWAL_FAILED:
      return <RetryBtcWithdraw withdrawal={withdrawal} />
    case BtcWithdrawStatus.CHALLENGE_READY:
      return <ChallengeBtcWithdrawal withdrawal={withdrawal} />
    default:
      return null
  }
}

type Props = {
  onClose: () => void
  withdrawal: ToBtcWithdrawOperation
}

const ReviewContent = function ({
  fromToken,
  onClose,
  withdrawal,
}: Props & { fromToken: EvmToken }) {
  const fromChain = useChain(withdrawal.l2ChainId)
  const [operationStatus] = useContext(EvmToBtcWithdrawalContext)
  const estimatedFees = useEstimateBtcWithdrawFees(withdrawal.l2ChainId)
  const t = useTranslations('tunnel-page.review-withdraw')

  const steps: StepPropsWithoutPosition[] = []

  const addWithdrawStep = function (): StepPropsWithoutPosition {
    const statusMap = {
      [BtcWithdrawStatus.TX_PENDING]: ProgressStatus.PROGRESS,
      [BtcWithdrawStatus.WITHDRAWAL_FAILED]: ProgressStatus.FAILED,
    }

    return {
      description:
        withdrawal.status === BtcWithdrawStatus.TX_CONFIRMED
          ? t('withdraw-completed')
          : t('initiate-withdrawal'),
      explorerChainId: withdrawal.l2ChainId,
      fees: [
        BtcWithdrawStatus.TX_PENDING,
        BtcWithdrawStatus.WITHDRAWAL_FAILED,
      ].includes(withdrawal.status)
        ? {
            amount: formatUnits(
              estimatedFees,
              fromChain?.nativeCurrency.decimals,
            ),
            symbol: fromChain?.nativeCurrency.symbol,
          }
        : undefined,
      status: statusMap[withdrawal.status] ?? ProgressStatus.COMPLETED,
      txHash: withdrawal.transactionHash,
    }
  }

  const addChallengeStep = function (): StepPropsWithoutPosition {
    const getChallengeStatus = function () {
      if (withdrawal.status < BtcWithdrawStatus.CHALLENGE_READY) {
        return ProgressStatus.NOT_READY
      }
      if (withdrawal.status === BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED) {
        return ProgressStatus.COMPLETED
      }
      const map = {
        failed: ProgressStatus.FAILED,
        proving: ProgressStatus.PROGRESS,
        rejected: ProgressStatus.REJECTED,
      }
      return map[operationStatus] ?? ProgressStatus.READY
    }
    return {
      description: t('challenge-withdrawal'),
      explorerChainId: withdrawal.l2ChainId,
      // TODO add fees - we need to run a few challenges and estimate gas units
      // a similar hook to useEstimateBtcWithdrawFees can be created/used
      fees: undefined,
      status: getChallengeStatus(),
      txHash: withdrawal.challengeTxHash,
    }
  }

  steps.push(addWithdrawStep())
  steps.push(addChallengeStep())

  return (
    <Operation
      amount={withdrawal.amount}
      callToAction={getCallToAction(withdrawal)}
      onClose={onClose}
      steps={steps}
      subtitle={
        withdrawal.status === BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED
          ? t('withdraw-completed')
          : t('withdraw-on-its-way')
      }
      title={t('heading')}
      token={fromToken}
    />
  )
}

export const ReviewBtcWithdrawal = function ({ onClose, withdrawal }: Props) {
  const { data: fromToken } = useToken({
    address: withdrawal.l2Token,
    chainId: withdrawal.l2ChainId,
  })

  const tokensLoaded = !!fromToken

  return (
    <EvmToBtcWithdrawalProvider>
      {tokensLoaded ? (
        <ReviewContent
          fromToken={fromToken as EvmToken}
          onClose={onClose}
          withdrawal={withdrawal}
        />
      ) : (
        <Skeleton className="h-full" />
      )}
    </EvmToBtcWithdrawalProvider>
  )
}
