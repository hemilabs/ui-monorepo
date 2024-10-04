import { MessageStatus } from '@eth-optimism/sdk'
import { useChain } from 'hooks/useChain'
import { useTranslations } from 'next-intl'
import { useContext } from 'react'
import { EvmToken } from 'types/token'
import { ToEvmWithdrawOperation } from 'types/tunnel'
import { formatGasFees } from 'utils/format'
import { getNativeToken, getTokenByAddress, isNativeToken } from 'utils/token'
import { formatUnits } from 'viem'

import {
  ToEvmWithdrawalContext,
  ToEvmWithdrawalProvider,
} from '../../_context/toEvmWithdrawalContext'
import { useClaimTransaction } from '../../_hooks/useClaimTransaction'
import { useProveTransaction } from '../../_hooks/useProveTransaction'
import { useWithdraw } from '../../_hooks/useWithdraw'
import { ClaimEvmWithdrawal } from '../claimEvmWithdrawal'
import { ProveWithdrawal } from '../proveEvmWithdrawal'

import { Operation } from './operation'
import { ProgressStatus } from './progressStatus'
import { type StepPropsWithoutPosition } from './step'

const ExpectedWithdrawalWaitTimeMinutes = 20
const ExpectedProofWaitTimeHours = 3

const getCallToAction = function (withdrawal: ToEvmWithdrawOperation) {
  if (
    ![MessageStatus.READY_TO_PROVE, MessageStatus.READY_FOR_RELAY].includes(
      withdrawal.status,
    )
  ) {
    return null
  }

  return withdrawal.status === MessageStatus.READY_TO_PROVE ? (
    <ProveWithdrawal withdrawal={withdrawal} />
  ) : (
    <ClaimEvmWithdrawal withdrawal={withdrawal} />
  )
}

type Props = {
  onClose: () => void
  withdrawal: ToEvmWithdrawOperation
}

const ReviewContent = function ({ onClose, withdrawal }: Props) {
  const toToken = getTokenByAddress(
    withdrawal.l1Token,
    withdrawal.l1ChainId,
  ) as EvmToken

  // L2 native tunneled token is on a special address, so it is easier to get the native token
  const fromToken = (
    isNativeToken(toToken)
      ? getNativeToken(withdrawal.l2ChainId)
      : getTokenByAddress(withdrawal.l2Token, withdrawal.l2ChainId)
  ) as EvmToken

  const fromChain = useChain(withdrawal.l2ChainId)
  const toChain = useChain(withdrawal.l1ChainId)
  const [operationStatus] = useContext(ToEvmWithdrawalContext)
  const t = useTranslations('tunnel-page.review-withdraw')
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
        minutes: ExpectedWithdrawalWaitTimeMinutes,
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
      proveWithdrawalTokenGasFees !== undefined
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
        hours: ExpectedProofWaitTimeHours,
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
      claimWithdrawalTokenGasFees !== undefined
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
          ? t('withdraw-completed')
          : t('withdraw-on-its-way')
      }
      title={t('heading')}
      token={fromToken}
    />
  )
}

export const ReviewEvmWithdrawal = ({ onClose, withdrawal }: Props) => (
  <ToEvmWithdrawalProvider>
    <ReviewContent onClose={onClose} withdrawal={withdrawal} />
  </ToEvmWithdrawalProvider>
)
