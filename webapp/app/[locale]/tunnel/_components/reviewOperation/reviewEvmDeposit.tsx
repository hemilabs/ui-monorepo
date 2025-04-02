'use client'

import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { useChain } from 'hooks/useChain'
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

import { EvmDepositProvider } from '../../_context/evmDepositContext'
import { useDeposit } from '../../_hooks/useDeposit'
import { RetryEvmDeposit } from '../retryEvmDeposit'

import { Operation } from './operation'

const getCallToAction = (deposit: EvmDepositOperation) =>
  deposit.status === EvmDepositStatus.DEPOSIT_TX_FAILED ? (
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

  const { approvalTokenGasFees, depositGasFees } = useDeposit({
    // this is just for fee estimation, so we just assume it's true unless the deposit is confirmed
    canDeposit: depositStatus !== EvmDepositStatus.DEPOSIT_TX_CONFIRMED,
    fromInput: formatUnits(BigInt(deposit.amount), fromToken.decimals),
    fromToken,
    toToken,
  })
  const t = useTranslations('tunnel-page.review-deposit')
  const tCommon = useTranslations('common')

  const steps: StepPropsWithoutPosition[] = []

  const getApprovalStep = (): StepPropsWithoutPosition => ({
    description:
      depositStatus >= EvmDepositStatus.APPROVAL_TX_COMPLETED
        ? t('approve-confirmed')
        : t('approve-initiated'),
    explorerChainId: deposit.l1ChainId,
    fees:
      depositStatus === EvmDepositStatus.APPROVAL_TX_PENDING
        ? {
            amount: formatUnits(
              approvalTokenGasFees,
              fromChain.nativeCurrency.decimals,
            ),
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
      description:
        depositStatus === EvmDepositStatus.DEPOSIT_TX_CONFIRMED ||
        EvmDepositStatus.DEPOSIT_RELAYED
          ? t('deposit-completed')
          : t('initiate-deposit'),
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
    description: t('get-your-funds-on-hemi'),
    status:
      depositStatus === EvmDepositStatus.DEPOSIT_RELAYED
        ? ProgressStatus.COMPLETED
        : ProgressStatus.NOT_READY,
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

  return (
    <Operation
      amount={deposit.amount}
      callToAction={getCallToAction(deposit)}
      onClose={onClose}
      steps={steps}
      subtitle={
        depositStatus === EvmDepositStatus.DEPOSIT_TX_CONFIRMED
          ? t('your-deposit-is-complete')
          : t('deposit-on-its-way')
      }
      title={t('review-deposit')}
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

  return (
    <EvmDepositProvider>
      {tokensLoaded ? (
        <ReviewContent
          deposit={deposit}
          fromToken={fromToken as EvmToken}
          onClose={onClose}
          toToken={toToken as EvmToken}
        />
      ) : (
        <Skeleton className="h-full" />
      )}
    </EvmDepositProvider>
  )
}
