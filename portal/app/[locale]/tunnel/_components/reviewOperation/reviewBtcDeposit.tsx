import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { WarningBox } from 'components/warningBox'
import { useBitcoin } from 'hooks/useBitcoin'
import { useChain } from 'hooks/useChain'
import { useGetFeePrices } from 'hooks/useEstimateBtcFees'
import { useHemi } from 'hooks/useHemi'
import { useToken } from 'hooks/useToken'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { type BtcToken } from 'types/token'
import { type BtcDepositOperation, BtcDepositStatus } from 'types/tunnel'
import { getNativeToken } from 'utils/nativeToken'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'

import { useEstimateBtcDepositFees } from '../../_hooks/useEstimateBtcDepositFees'
import { ConfirmBtcDeposit } from '../confirmBtcDeposit'
import { RetryBtcDeposit } from '../retryBtcDeposit'

import { ChainLabel } from './chainLabel'
import { Operation } from './operation'

const getCallToAction = function (deposit: BtcDepositOperation) {
  switch (deposit.status) {
    case BtcDepositStatus.BTC_TX_FAILED:
      return <RetryBtcDeposit deposit={deposit} />
    case BtcDepositStatus.READY_TO_MANUAL_CONFIRM:
    case BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMING:
    case BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMATION_TX_FAILED:
      return <ConfirmBtcDeposit deposit={deposit} />
    default:
      return null
  }
}

const ExpectedManualConfirmationDepositTimeHours = 3

type Props = {
  deposit: BtcDepositOperation
  onClose: () => void
}

const ReviewContent = function ({
  deposit,
  fromToken,
  onClose,
}: Props & { fromToken: BtcToken }) {
  const depositStatus = deposit.status ?? BtcDepositStatus.BTC_TX_PENDING

  const { isConnected } = useAccount()
  const bitcoin = useBitcoin()

  const hemi = useHemi()
  const l2chain = useChain(deposit.l2ChainId)

  // Fees for bitcoin deposit
  const { feePrices } = useGetFeePrices()
  const tCommon = useTranslations('common')
  const t = useTranslations('tunnel-page.review-deposit')

  const showDepositConfirmationFees =
    isConnected &&
    [
      BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMING,
      BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMATION_TX_FAILED,
      BtcDepositStatus.READY_TO_MANUAL_CONFIRM,
    ].includes(depositStatus)

  const { fees: estimatedFees, isError: isEstimatedFeesError } =
    useEstimateBtcDepositFees({
      deposit,
      enabled: showDepositConfirmationFees,
    })

  const shouldAddManualConfirmationStep = () =>
    [
      BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMING,
      BtcDepositStatus.READY_TO_MANUAL_CONFIRM,
      BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMATION_TX_FAILED,
      BtcDepositStatus.BTC_DEPOSITED_MANUALLY,
    ].includes(deposit.status) || deposit.confirmationTransactionHash

  const steps: StepPropsWithoutPosition[] = []

  const getDepositStep = function (): StepPropsWithoutPosition {
    const statusMap = {
      [BtcDepositStatus.BTC_TX_PENDING]: ProgressStatus.PROGRESS,
      [BtcDepositStatus.BTC_TX_FAILED]: ProgressStatus.FAILED,
    }

    const postActionStatusMap = {
      [BtcDepositStatus.BTC_TX_PENDING]: ProgressStatus.NOT_READY,
      [BtcDepositStatus.BTC_TX_CONFIRMED]: ProgressStatus.PROGRESS,
      [BtcDepositStatus.BTC_TX_FAILED]: ProgressStatus.NOT_READY,
    }

    return {
      description: (
        <ChainLabel
          active={depositStatus === BtcDepositStatus.BTC_TX_PENDING}
          chainId={bitcoin.id}
          label={t('start-on', { networkName: bitcoin.name })}
        />
      ),
      explorerChainId: deposit.l1ChainId,
      fees:
        [
          BtcDepositStatus.BTC_TX_PENDING,
          BtcDepositStatus.BTC_TX_FAILED,
        ].includes(depositStatus) && feePrices?.fastestFee
          ? {
              amount: feePrices?.fastestFee?.toString(),
              // Bitcoin fees use a special symbol
              token: { ...getNativeToken(bitcoin.id), symbol: 'sat/vB' },
            }
          : undefined,
      postAction: {
        description: tCommon.rich('wait-hours', {
          hours: () =>
            tCommon('hours', {
              hours: ExpectedManualConfirmationDepositTimeHours,
            }),
        }),
        status: postActionStatusMap[depositStatus] ?? ProgressStatus.COMPLETED,
      },
      status: statusMap[depositStatus] ?? ProgressStatus.COMPLETED,
      txHash: deposit.transactionHash,
    }
  }

  const getDepositFinalizedStep = function (): StepPropsWithoutPosition {
    const statusMap = {
      [BtcDepositStatus.READY_TO_MANUAL_CONFIRM]: ProgressStatus.FAILED,
      [BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMING]: ProgressStatus.FAILED,
      [BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMATION_TX_FAILED]:
        ProgressStatus.FAILED,
      [BtcDepositStatus.BTC_DEPOSITED]: ProgressStatus.COMPLETED,
      [BtcDepositStatus.BTC_DEPOSITED_MANUALLY]: ProgressStatus.FAILED,
      [BtcDepositStatus.BTC_TX_FAILED]: ProgressStatus.FAILED,
    }

    return {
      description: (
        <ChainLabel
          active={depositStatus === BtcDepositStatus.BTC_TX_CONFIRMED}
          chainId={deposit.l2ChainId}
          label={t('get-your-funds-on', { networkName: l2chain.name })}
        />
      ),
      status: statusMap[depositStatus] ?? ProgressStatus.NOT_READY,
    }
  }

  const getManualConfirmationStep = function (): StepPropsWithoutPosition {
    const getConfirmDepositStatus = function () {
      if (deposit.status === BtcDepositStatus.BTC_DEPOSITED_MANUALLY) {
        return ProgressStatus.COMPLETED
      }
      const map = {
        [BtcDepositStatus.READY_TO_MANUAL_CONFIRM]: ProgressStatus.READY,
        [BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMING]: ProgressStatus.PROGRESS,
        [BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMATION_TX_FAILED]:
          ProgressStatus.FAILED,
        [BtcDepositStatus.BTC_DEPOSITED_MANUALLY]: ProgressStatus.COMPLETED,
      }
      return map[deposit.status] ?? ProgressStatus.NOT_READY
    }

    return {
      description: (
        <ChainLabel
          active={depositStatus === BtcDepositStatus.READY_TO_MANUAL_CONFIRM}
          chainId={deposit.l2ChainId}
          label={t('confirm-deposit-on', { networkName: l2chain.name })}
        />
      ),
      explorerChainId: deposit.l2ChainId,
      fees: showDepositConfirmationFees
        ? {
            amount: formatUnits(estimatedFees, hemi.nativeCurrency.decimals),
            isError: isEstimatedFeesError,
            token: getNativeToken(hemi.id),
          }
        : undefined,
      separator: true,
      status: getConfirmDepositStatus(),
      txHash: deposit.confirmationTransactionHash,
    }
  }

  steps.push(getDepositStep())
  steps.push(getDepositFinalizedStep())

  if (shouldAddManualConfirmationStep()) {
    steps.push(getManualConfirmationStep())
  }

  const getBottomSection = function () {
    if (
      [
        BtcDepositStatus.READY_TO_MANUAL_CONFIRM,
        BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMING,
        BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMATION_TX_FAILED,
      ].includes(deposit.status)
    ) {
      return (
        <div className="px-4 py-4 md:px-6">
          <WarningBox
            heading={t('we-could-not-process-this-deposit')}
            subheading={t('click-to-confirm')}
          />
        </div>
      )
    }
    return null
  }

  return (
    <Operation
      amount={deposit.amount}
      bottomSection={getBottomSection()}
      callToAction={getCallToAction(deposit)}
      heading={t('review-deposit')}
      onClose={onClose}
      steps={steps}
      subheading={
        depositStatus === BtcDepositStatus.BTC_DEPOSITED
          ? t('your-deposit-is-complete')
          : t('btc-deposit-come-back-delay-note', {
              hours: ExpectedManualConfirmationDepositTimeHours,
            })
      }
      token={fromToken}
    />
  )
}

export const ReviewBtcDeposit = function ({ deposit, onClose }: Props) {
  const { data: fromToken } = useToken({
    address: deposit.l1Token,
    chainId: deposit.l1ChainId,
  })

  const tokensLoaded = !!fromToken

  return (
    <>
      {tokensLoaded ? (
        <ReviewContent
          deposit={deposit}
          fromToken={fromToken as BtcToken}
          onClose={onClose}
        />
      ) : (
        <Skeleton className="h-full" />
      )}
    </>
  )
}
