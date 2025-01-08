import { useGetFeePrices } from 'hooks/useEstimateBtcFees'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemi } from 'hooks/useHemi'
import { useToken } from 'hooks/useToken'
import { useTranslations } from 'next-intl'
import { useContext } from 'react'
import Skeleton from 'react-loading-skeleton'
import { type BtcToken } from 'types/token'
import { type BtcDepositOperation, BtcDepositStatus } from 'types/tunnel'
import { formatGasFees } from 'utils/format'
import { useAccount } from 'wagmi'

import {
  BtcToEvmDepositContext,
  BtcToEvmDepositProvider,
} from '../../_context/btcToEvmContext'
import { ConfirmBtcDeposit } from '../confirmBtcDeposit'
import { RetryBtcDeposit } from '../retryBtcDeposit'

import { Operation } from './operation'
import { ProgressStatus } from './progressStatus'
import { type StepPropsWithoutPosition } from './step'

const getCallToAction = function (deposit: BtcDepositOperation) {
  switch (deposit.status) {
    case BtcDepositStatus.DEPOSIT_TX_FAILED:
      return <RetryBtcDeposit deposit={deposit} />
    case BtcDepositStatus.BTC_READY_CLAIM:
      return <ConfirmBtcDeposit deposit={deposit} />
    default:
      return null
  }
}

const ConfirmBtcDepositGasUnits = BigInt(400_000)
const ExpectedClaimDepositTimeHours = 3

type Props = {
  deposit: BtcDepositOperation
  onClose: () => void
}

const ReviewContent = function ({
  deposit,
  fromToken,
  onClose,
}: Props & { fromToken: BtcToken }) {
  const depositStatus = deposit.status ?? BtcDepositStatus.TX_PENDING

  const { isConnected } = useAccount()
  const [operationStatus] = useContext(BtcToEvmDepositContext)
  // fees for bitcoin claiming
  const showClaimingFees =
    isConnected && BtcDepositStatus.BTC_READY_CLAIM === depositStatus
  const estimatedFees = useEstimateFees({
    chainId: deposit.l2ChainId,
    enabled: showClaimingFees,
    gasUnits: ConfirmBtcDepositGasUnits,
    overEstimation: 1.5,
  })
  const hemi = useHemi()

  // Fees for bitcoin deposit
  const { feePrices } = useGetFeePrices()
  const t = useTranslations('tunnel-page.review-deposit')

  const steps: StepPropsWithoutPosition[] = []

  const getClaimStatus = function () {
    if (deposit.status === BtcDepositStatus.BTC_DEPOSITED) {
      return ProgressStatus.COMPLETED
    }
    if (deposit.status !== BtcDepositStatus.BTC_READY_CLAIM) {
      return ProgressStatus.NOT_READY
    }
    const map = {
      claiming: ProgressStatus.PROGRESS,
      failed: ProgressStatus.FAILED,
      rejected: ProgressStatus.REJECTED,
    }
    return map[operationStatus] ?? ProgressStatus.READY
  }

  const getDepositStep = function (): StepPropsWithoutPosition {
    const statusMap = {
      [BtcDepositStatus.TX_PENDING]: ProgressStatus.PROGRESS,
      [BtcDepositStatus.DEPOSIT_TX_FAILED]: ProgressStatus.FAILED,
    }

    return {
      description: t('initiate-deposit'),
      explorerChainId: deposit.l1ChainId,
      fees:
        [
          BtcDepositStatus.TX_PENDING,
          BtcDepositStatus.DEPOSIT_TX_FAILED,
        ].includes(depositStatus) && feePrices?.fastestFee
          ? {
              amount: feePrices?.fastestFee?.toString(),
              symbol: 'sat/vB',
            }
          : undefined,
      status: statusMap[depositStatus] ?? ProgressStatus.COMPLETED,
      txHash: deposit.transactionHash,
    }
  }

  const getClaimStep = (): StepPropsWithoutPosition => ({
    description: t('claim-deposit'),
    explorerChainId: deposit.l2ChainId,
    fees: showClaimingFees
      ? {
          amount: formatGasFees(estimatedFees, hemi.nativeCurrency.decimals),
          symbol: hemi.nativeCurrency.symbol,
        }
      : undefined,
    status: getClaimStatus(),
    txHash: deposit.claimTransactionHash,
  })

  steps.push(getDepositStep())
  steps.push(getClaimStep())

  return (
    <Operation
      amount={deposit.amount}
      callToAction={getCallToAction(deposit)}
      onClose={onClose}
      steps={steps}
      subtitle={
        depositStatus === BtcDepositStatus.BTC_DEPOSITED
          ? t('your-deposit-is-complete')
          : t('btc-deposit-come-back-delay-note', {
              hours: ExpectedClaimDepositTimeHours,
            })
      }
      title={t('review-deposit')}
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
    <BtcToEvmDepositProvider>
      {tokensLoaded ? (
        <ReviewContent
          deposit={deposit}
          fromToken={fromToken as BtcToken}
          onClose={onClose}
        />
      ) : (
        <Skeleton className="h-full" />
      )}
    </BtcToEvmDepositProvider>
  )
}
