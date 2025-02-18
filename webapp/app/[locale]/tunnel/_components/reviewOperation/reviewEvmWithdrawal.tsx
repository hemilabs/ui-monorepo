import { MessageStatus } from '@eth-optimism/sdk'
import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { useChain } from 'hooks/useChain'
import { useNetworkType } from 'hooks/useNetworkType'
import { useToken } from 'hooks/useToken'
import { useTranslations } from 'next-intl'
import { useContext } from 'react'
import { type EvmToken } from 'token-list'
import { ToEvmWithdrawOperation } from 'types/tunnel'
import { formatGasFees } from 'utils/format'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'

import {
  ToEvmWithdrawalContext,
  ToEvmWithdrawalProvider,
} from '../../_context/toEvmWithdrawalContext'
import { useClaimTransaction } from '../../_hooks/useClaimTransaction'
import { useProveTransaction } from '../../_hooks/useProveTransaction'
import { useWithdraw } from '../../_hooks/useWithdraw'
import { ClaimEvmWithdrawal } from '../claimEvmWithdrawal'
import { ProveWithdrawal } from '../proveEvmWithdrawal'
import { RetryEvmWithdrawal } from '../retryEvmWithdrawal'

import { Operation } from './operation'

const ExpectedWithdrawalWaitTimeMinutesTestnet = 20
const ExpectedWithdrawalWaitTimeMinutesMainnet = 30
const ExpectedProofWaitTimeHoursTestnet = 3
const ExpectedProofWaitTimeHoursMainnet = 24

const getCallToAction = (withdrawal: ToEvmWithdrawOperation) =>
  ({
    [MessageStatus.FAILED_L1_TO_L2_MESSAGE]: (
      <RetryEvmWithdrawal withdrawal={withdrawal} />
    ),
    [MessageStatus.READY_TO_PROVE]: <ProveWithdrawal withdrawal={withdrawal} />,
    [MessageStatus.READY_FOR_RELAY]: (
      <ClaimEvmWithdrawal withdrawal={withdrawal} />
    ),
  })[withdrawal.status]

type Props = {
  onClose: () => void
  withdrawal: ToEvmWithdrawOperation
}

const ReviewContent = function ({
  fromToken,
  onClose,
  toToken,
  withdrawal,
}: Props & {
  fromToken: EvmToken
  toToken: EvmToken
}) {
  const { chainId: connectedChainId } = useAccount()
  const fromChain = useChain(withdrawal.l2ChainId)
  const toChain = useChain(withdrawal.l1ChainId)
  const [operationStatus] = useContext(ToEvmWithdrawalContext)
  const [networkType] = useNetworkType()
  const t = useTranslations('tunnel-page.review-withdrawal')
  const tCommon = useTranslations('common')

  const { claimWithdrawalTokenGasFees } = useClaimTransaction(withdrawal)

  const { proveWithdrawalTokenGasFees } = useProveTransaction(withdrawal)

  const { withdrawGasFees } = useWithdraw({
    // only estimate fees for the first step
    canWithdraw:
      withdrawal.status === MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE,
    fromInput: formatUnits(BigInt(withdrawal.amount), fromToken.decimals),
    fromToken,
    l1ChainId: toToken.chainId,
    l2ChainId: fromToken.chainId,
    toToken,
  })

  const getWithdrawalStatus = function () {
    const map = {
      [MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE]: ProgressStatus.NOT_READY,
      [MessageStatus.STATE_ROOT_NOT_PUBLISHED]: ProgressStatus.PROGRESS,
      [MessageStatus.FAILED_L1_TO_L2_MESSAGE]: ProgressStatus.FAILED,
    }
    return map[withdrawal.status] ?? ProgressStatus.COMPLETED
  }

  const steps: StepPropsWithoutPosition[] = []

  const getInitiateWithdrawStep = (): StepPropsWithoutPosition => ({
    description: t('initiate-withdrawal'),
    explorerChainId: withdrawal.l2ChainId,
    fees:
      withdrawGasFees !== undefined
        ? {
            amount: formatGasFees(
              withdrawGasFees,
              fromChain.nativeCurrency.decimals,
            ),
            symbol: fromChain.nativeCurrency.symbol,
          }
        : undefined,
    postAction: {
      description: tCommon('wait-minutes', {
        minutes:
          networkType === 'mainnet'
            ? ExpectedWithdrawalWaitTimeMinutesMainnet
            : ExpectedWithdrawalWaitTimeMinutesTestnet,
      }),
      status: getWithdrawalStatus(),
    },
    status:
      withdrawal.status === MessageStatus.FAILED_L1_TO_L2_MESSAGE
        ? ProgressStatus.FAILED
        : withdrawal.status >= MessageStatus.STATE_ROOT_NOT_PUBLISHED
          ? ProgressStatus.COMPLETED
          : ProgressStatus.PROGRESS,
    txHash: withdrawal.transactionHash,
  })

  const getClaimStatus = function () {
    if (withdrawal.status === MessageStatus.RELAYED) {
      return ProgressStatus.COMPLETED
    }
    if (withdrawal.status !== MessageStatus.READY_FOR_RELAY) {
      return ProgressStatus.NOT_READY
    }

    const map = {
      claiming: ProgressStatus.PROGRESS,
      failed: ProgressStatus.FAILED,
      rejected: ProgressStatus.REJECTED,
    }
    return map[operationStatus] ?? ProgressStatus.READY
  }

  const getProveStatus = function () {
    if (withdrawal.status < MessageStatus.READY_TO_PROVE) {
      return ProgressStatus.NOT_READY
    }
    if (withdrawal.status >= MessageStatus.IN_CHALLENGE_PERIOD) {
      return ProgressStatus.COMPLETED
    }
    const map = {
      failed: ProgressStatus.FAILED,
      proving: ProgressStatus.PROGRESS,
      rejected: ProgressStatus.REJECTED,
    }
    return map[operationStatus] ?? ProgressStatus.READY
  }

  const getProveStep = (): StepPropsWithoutPosition => ({
    description: t('prove-withdrawal'),
    explorerChainId: withdrawal.l1ChainId,
    fees:
      connectedChainId === withdrawal.l1ChainId &&
      proveWithdrawalTokenGasFees !== BigInt(0)
        ? {
            amount: formatGasFees(
              proveWithdrawalTokenGasFees,
              toChain.nativeCurrency.decimals,
            ),
            symbol: toChain.nativeCurrency.symbol,
          }
        : undefined,
    postAction: {
      description: tCommon('wait-hours', {
        hours:
          networkType === 'mainnet'
            ? ExpectedProofWaitTimeHoursMainnet
            : ExpectedProofWaitTimeHoursTestnet,
      }),
      status:
        withdrawal.status >= MessageStatus.READY_FOR_RELAY
          ? ProgressStatus.COMPLETED
          : withdrawal.status === MessageStatus.IN_CHALLENGE_PERIOD
            ? ProgressStatus.PROGRESS
            : ProgressStatus.NOT_READY,
    },
    status: getProveStatus(),
    txHash: withdrawal.proveTxHash,
  })

  const getClaimStep = (): StepPropsWithoutPosition => ({
    description: t('claim-withdrawal'),
    explorerChainId: withdrawal.l1ChainId,
    fees:
      connectedChainId === withdrawal.l1ChainId &&
      claimWithdrawalTokenGasFees !== BigInt(0)
        ? {
            amount: formatGasFees(
              claimWithdrawalTokenGasFees,
              toChain.nativeCurrency.decimals,
            ),
            symbol: toChain.nativeCurrency.symbol,
          }
        : undefined,
    status: getClaimStatus(),
    txHash: withdrawal.claimTxHash,
  })

  steps.push(getInitiateWithdrawStep())
  steps.push(getProveStep())
  steps.push(getClaimStep())

  return (
    <Operation
      amount={withdrawal.amount}
      callToAction={getCallToAction(withdrawal)}
      onClose={onClose}
      steps={steps}
      subtitle={
        withdrawal.status === MessageStatus.RELAYED
          ? t('your-withdraw-is-completed')
          : t('withdraw-on-its-way')
      }
      title={t('heading')}
      token={fromToken}
    />
  )
}

export const ReviewEvmWithdrawal = function ({ onClose, withdrawal }: Props) {
  const { data: toToken } = useToken({
    address: withdrawal.l1Token,
    chainId: withdrawal.l1ChainId,
  })

  const { data: fromToken } = useToken({
    address: withdrawal.l2Token,
    chainId: withdrawal.l2ChainId,
  })

  const tokensLoaded = !!fromToken && !!toToken

  return (
    <ToEvmWithdrawalProvider>
      {tokensLoaded ? (
        <ReviewContent
          fromToken={fromToken as EvmToken}
          onClose={onClose}
          toToken={toToken as EvmToken}
          withdrawal={withdrawal}
        />
      ) : null}
    </ToEvmWithdrawalProvider>
  )
}
