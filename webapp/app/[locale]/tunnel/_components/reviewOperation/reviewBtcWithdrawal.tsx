'use client'

import { useChain } from 'hooks/useChain'
import { useEstimateBtcWithdrawFees } from 'hooks/useEstimateBtcWithdrawFees'
import { useEstimateChallengeBtcWithdrawalFees } from 'hooks/useEstimateChallengeBtcWithdrawalFees'
import { useSimpleVaultGracePeriod } from 'hooks/useSimpleVaultGracePeriod'
import { useToken } from 'hooks/useToken'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { EvmToken } from 'types/token'
import { BtcWithdrawStatus, ToBtcWithdrawOperation } from 'types/tunnel'
import { secondsToHours } from 'utils/time'
import { formatUnits } from 'viem'

import { ChallengeBtcWithdrawal } from '../challengeBtcWithdrawal'
import { RetryBtcWithdraw } from '../retryBtcWithdraw'

import { Operation } from './operation'
import { ProgressStatus } from './progressStatus'
import { type StepPropsWithoutPosition } from './step'

const getCallToAction = function (withdrawal: ToBtcWithdrawOperation) {
  switch (withdrawal.status) {
    case BtcWithdrawStatus.WITHDRAWAL_FAILED:
      return <RetryBtcWithdraw withdrawal={withdrawal} />
    case BtcWithdrawStatus.CHALLENGE_FAILED:
    case BtcWithdrawStatus.CHALLENGE_IN_PROGRESS:
    case BtcWithdrawStatus.READY_TO_CHALLENGE:
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
  vaultGracePeriod,
  onClose,
  withdrawal,
}: Props & { fromToken: EvmToken; vaultGracePeriod: bigint }) {
  const fromChain = useChain(withdrawal.l2ChainId)
  const bitcoinWithdrawalEstimatedFees = useEstimateBtcWithdrawFees(
    withdrawal.l2ChainId,
  )
  const challengeWithdrawalEstimatedFees =
    useEstimateChallengeBtcWithdrawalFees(withdrawal.l2ChainId)
  const t = useTranslations('tunnel-page.review-withdraw')
  const tCommon = useTranslations('common')

  const shouldAddChallengeStep = () =>
    ![
      BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED,
      BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING,
      BtcWithdrawStatus.WITHDRAWAL_FAILED,
      BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED,
    ].includes(withdrawal.status)

  const steps: StepPropsWithoutPosition[] = []

  const addWithdrawStep = function (): StepPropsWithoutPosition {
    const statusMap = {
      [BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING]: ProgressStatus.PROGRESS,
      [BtcWithdrawStatus.WITHDRAWAL_FAILED]: ProgressStatus.FAILED,
    }

    const postActionStatus = {
      [BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED]: ProgressStatus.PROGRESS,
      [BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING]: ProgressStatus.NOT_READY,
      [BtcWithdrawStatus.WITHDRAWAL_FAILED]: ProgressStatus.NOT_READY,
    }

    return {
      description: t('initiate-withdrawal'),
      explorerChainId: withdrawal.l2ChainId,
      fees: [
        BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING,
        BtcWithdrawStatus.WITHDRAWAL_FAILED,
      ].includes(withdrawal.status)
        ? {
            amount: formatUnits(
              bitcoinWithdrawalEstimatedFees,
              fromChain?.nativeCurrency.decimals,
            ),
            symbol: fromChain?.nativeCurrency.symbol,
          }
        : undefined,
      postAction: {
        description: tCommon('wait-hours', {
          hours: secondsToHours(Number(vaultGracePeriod)).toString(),
        }),
        status: postActionStatus[withdrawal.status] ?? ProgressStatus.COMPLETED,
      },
      status: statusMap[withdrawal.status] ?? ProgressStatus.COMPLETED,
      txHash: withdrawal.transactionHash,
    }
  }

  const addChallengeStep = function (): StepPropsWithoutPosition {
    const getChallengeStatus = function () {
      const map = {
        [BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING]: ProgressStatus.NOT_READY,
        [BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED]:
          ProgressStatus.NOT_READY,
        [BtcWithdrawStatus.READY_TO_CHALLENGE]: ProgressStatus.READY,
        [BtcWithdrawStatus.CHALLENGE_IN_PROGRESS]: ProgressStatus.PROGRESS,
        [BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED]: ProgressStatus.COMPLETED,
        [BtcWithdrawStatus.WITHDRAWAL_CHALLENGED]: ProgressStatus.COMPLETED,
        [BtcWithdrawStatus.WITHDRAWAL_FAILED]: ProgressStatus.FAILED,
        [BtcWithdrawStatus.CHALLENGE_FAILED]: ProgressStatus.FAILED,
      }
      return map[withdrawal.status]
    }
    return {
      description: t('challenge-withdrawal'),
      explorerChainId: withdrawal.l2ChainId,
      fees: [
        BtcWithdrawStatus.CHALLENGE_FAILED,
        BtcWithdrawStatus.CHALLENGE_IN_PROGRESS,
        BtcWithdrawStatus.READY_TO_CHALLENGE,
      ].includes(withdrawal.status)
        ? {
            amount: formatUnits(
              challengeWithdrawalEstimatedFees,
              fromChain?.nativeCurrency.decimals,
            ),
            symbol: fromChain?.nativeCurrency.symbol,
          }
        : undefined,
      separator: true,
      status: getChallengeStatus(),
      txHash: withdrawal.challengeTxHash,
    }
  }

  const addWithdrawalCompleted = function (): StepPropsWithoutPosition {
    const status = {
      [BtcWithdrawStatus.CHALLENGE_FAILED]: ProgressStatus.FAILED,
      [BtcWithdrawStatus.CHALLENGE_IN_PROGRESS]: ProgressStatus.FAILED,
      [BtcWithdrawStatus.READY_TO_CHALLENGE]: ProgressStatus.FAILED,
      [BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED]: ProgressStatus.NOT_READY,
      [BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING]: ProgressStatus.NOT_READY,
      [BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED]: ProgressStatus.COMPLETED,
      [BtcWithdrawStatus.WITHDRAWAL_CHALLENGED]: ProgressStatus.FAILED,
      [BtcWithdrawStatus.WITHDRAWAL_FAILED]: ProgressStatus.NOT_READY,
    }
    return {
      description: t('withdraw-completed'),
      status: status[withdrawal.status],
    }
  }

  steps.push(addWithdrawStep())
  steps.push(addWithdrawalCompleted())
  if (shouldAddChallengeStep()) {
    steps.push(addChallengeStep())
  }

  return (
    <Operation
      amount={withdrawal.amount}
      callToAction={getCallToAction(withdrawal)}
      onClose={onClose}
      steps={steps}
      subtitle={
        withdrawal.status === BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED
          ? t('your-withdraw-is-completed')
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

  const { vaultGracePeriod } = useSimpleVaultGracePeriod()

  const tokensLoaded = !!fromToken && vaultGracePeriod !== undefined

  return (
    <>
      {tokensLoaded ? (
        <ReviewContent
          fromToken={fromToken as EvmToken}
          onClose={onClose}
          vaultGracePeriod={vaultGracePeriod}
          withdrawal={withdrawal}
        />
      ) : (
        <Skeleton className="h-full" />
      )}
    </>
  )
}
