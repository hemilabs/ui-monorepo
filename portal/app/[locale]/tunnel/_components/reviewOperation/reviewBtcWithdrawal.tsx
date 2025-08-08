'use client'

import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { Operation } from 'components/reviewOperation/operation'
import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { WarningBox } from 'components/warningBox'
import { useChain } from 'hooks/useChain'
import { useSimpleVaultGracePeriod } from 'hooks/useSimpleVaultGracePeriod'
import { useToken } from 'hooks/useToken'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { EvmToken } from 'types/token'
import { BtcWithdrawStatus, ToBtcWithdrawOperation } from 'types/tunnel'
import { getNativeToken } from 'utils/nativeToken'
import { secondsToHours } from 'utils/time'
import { parseTokenUnits } from 'utils/token'
import { formatUnits } from 'viem'

import { useEstimateChallengeBtcWithdrawFees } from '../../_hooks/useEstimateBtcChallengeWithdrawFees'
import { useEstimateBtcWithdrawFees } from '../../_hooks/useEstimateBtcWithdrawFees'
import { ChallengeBtcWithdrawal } from '../challengeBtcWithdrawal'
import { RetryBtcWithdraw } from '../retryBtcWithdraw'

import { ChainLabel } from './chainLabel'

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
  onClose,
  withdrawal,
}: Props & { fromToken: EvmToken }) {
  const fromChain = useChain(withdrawal.l2ChainId)
  const toChain = useChain(withdrawal.l1ChainId)

  const { address: btcAddress } = useBtcAccount()

  const showWithdrawalStepFees = [
    BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING,
    BtcWithdrawStatus.WITHDRAWAL_FAILED,
  ].includes(withdrawal.status)

  const showChallengeStepFees = [
    BtcWithdrawStatus.CHALLENGE_FAILED,
    BtcWithdrawStatus.CHALLENGE_IN_PROGRESS,
    BtcWithdrawStatus.READY_TO_CHALLENGE,
  ].includes(withdrawal.status)

  const {
    fees: bitcoinWithdrawalEstimatedFees,
    isError: isBitcoinWithdrawalEstimateFeesError,
  } = useEstimateBtcWithdrawFees({
    amount: parseTokenUnits(withdrawal.amount, fromToken),
    btcAddress,
    enabled: !!btcAddress && showWithdrawalStepFees,
    l2ChainId: withdrawal.l2ChainId,
  })

  const isValidUuid = !!withdrawal.uuid
  const {
    fees: challengeWithdrawalEstimatedFees,
    isError: isChallengeWithdrawalEstimateFeesError,
  } = useEstimateChallengeBtcWithdrawFees({
    enabled: isValidUuid && showChallengeStepFees,
    l2ChainId: withdrawal.l2ChainId,
    uuid: isValidUuid ? BigInt(withdrawal.uuid) : BigInt(0),
  })

  const { isLoading: isLoadingVaultGracePeriod, vaultGracePeriod = BigInt(0) } =
    useSimpleVaultGracePeriod()
  const t = useTranslations('tunnel-page.review-withdrawal')
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
      description: (
        <ChainLabel
          active={
            withdrawal.status === BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING
          }
          chainId={withdrawal.l2ChainId}
          label={t('start-on', { networkName: fromChain.name })}
        />
      ),
      explorerChainId: withdrawal.l2ChainId,
      fees: showWithdrawalStepFees
        ? {
            amount: formatUnits(
              bitcoinWithdrawalEstimatedFees,
              fromChain?.nativeCurrency.decimals,
            ),
            isError: isBitcoinWithdrawalEstimateFeesError,
            token: getNativeToken(fromChain.id),
          }
        : undefined,
      postAction: {
        description: tCommon.rich('wait-hours', {
          hours: () =>
            isLoadingVaultGracePeriod ? (
              <Skeleton
                className="h-full w-12"
                containerClassName="h-5 inline-table"
              />
            ) : (
              tCommon('hours', {
                hours: secondsToHours(Number(vaultGracePeriod)).toString(),
              })
            ),
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
      description: (
        <ChainLabel
          active={withdrawal.status === BtcWithdrawStatus.READY_TO_CHALLENGE}
          chainId={withdrawal.l2ChainId}
          label={t('get-funds-back', { networkName: fromChain.name })}
        />
      ),
      explorerChainId: withdrawal.l2ChainId,
      fees: showChallengeStepFees
        ? {
            amount: formatUnits(
              challengeWithdrawalEstimatedFees,
              fromChain?.nativeCurrency.decimals,
            ),
            isError: isChallengeWithdrawalEstimateFeesError,
            token: getNativeToken(fromChain.id),
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
      description: (
        <ChainLabel
          active={withdrawal.status === BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED}
          chainId={withdrawal.l1ChainId}
          label={t('receive-funds-on', { networkName: toChain.name })}
        />
      ),
      status: status[withdrawal.status],
    }
  }

  steps.push(addWithdrawStep())
  steps.push(addWithdrawalCompleted())
  if (shouldAddChallengeStep()) {
    steps.push(addChallengeStep())
  }

  const getBottomSection = function () {
    if (
      [
        BtcWithdrawStatus.CHALLENGE_FAILED,
        BtcWithdrawStatus.CHALLENGE_IN_PROGRESS,
        BtcWithdrawStatus.READY_TO_CHALLENGE,
      ].includes(withdrawal.status)
    ) {
      return (
        <div className="px-4 py-4 md:px-6">
          <WarningBox
            heading={t('we-could-not-process-this-withdraw')}
            subheading={t('challenge-to-get-bitcoins-back')}
          />
        </div>
      )
    }
    return null
  }

  return (
    <Operation
      amount={withdrawal.amount}
      bottomSection={getBottomSection()}
      callToAction={getCallToAction(withdrawal)}
      heading={t('heading')}
      onClose={onClose}
      steps={steps}
      subheading={
        withdrawal.status === BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED
          ? t('your-withdraw-is-completed')
          : t('withdraw-on-its-way')
      }
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
    <>
      {tokensLoaded ? (
        <ReviewContent
          fromToken={fromToken as EvmToken}
          onClose={onClose}
          withdrawal={withdrawal}
        />
      ) : (
        <Skeleton className="h-full" />
      )}
    </>
  )
}
