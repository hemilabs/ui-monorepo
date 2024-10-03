import { MessageStatus } from '@eth-optimism/sdk'
import { useChain } from 'hooks/useChain'
import { useTranslations } from 'next-intl'
import { ComponentProps } from 'react'
import { EvmToken } from 'types/token'
import { ToEvmWithdrawOperation } from 'types/tunnel'
import { formatGasFees } from 'utils/format'
import { getNativeToken, getTokenByAddress, isNativeToken } from 'utils/token'
import { formatUnits } from 'viem'

import { useClaimTransaction } from '../../_hooks/useClaimTransaction'
import { useProveTransaction } from '../../_hooks/useProveTransaction'
import { useWithdraw } from '../../_hooks/useWithdraw'

import { Operation } from './operation'
import { ProgressStatus } from './progressStatus'
import { Step } from './step'

const ExpectedWithdrawalWaitTimeMinutes = 20
const ExpectedProofWaitTimeHours = 3

type Props = {
  onClose: () => void
  withdrawal: ToEvmWithdrawOperation
}

export const ReviewEvmWithdrawal = function ({ onClose, withdrawal }: Props) {
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
  const t = useTranslations('tunnel-page.review-withdraw')
  const tCommon = useTranslations('common')

  const { claimWithdrawalTokenGasFees } = useClaimTransaction({
    l1ChainId: withdrawal.l1ChainId,
    withdrawTxHash: withdrawal.transactionHash,
  })

  const { proveWithdrawalTokenGasFees } = useProveTransaction({
    l1ChainId: withdrawal.l1ChainId,
    withdrawTxHash: withdrawal.transactionHash,
  })

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

  const steps: Omit<ComponentProps<typeof Step>, 'position'>[] = []

  const getInitiateWithdrawStep = () => ({
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
      status:
        withdrawal.status >= MessageStatus.READY_TO_PROVE
          ? ProgressStatus.COMPLETED
          : withdrawal.status === MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE
            ? ProgressStatus.PROGRESS
            : ProgressStatus.NOT_READY,
    },
    status:
      withdrawal.status >= MessageStatus.STATE_ROOT_NOT_PUBLISHED
        ? ProgressStatus.COMPLETED
        : ProgressStatus.PROGRESS,
    txHash: withdrawal.transactionHash,
  })

  const getProveStatus = function () {
    if (withdrawal.status < MessageStatus.READY_TO_PROVE)
      return ProgressStatus.NOT_READY
    if (withdrawal.status === MessageStatus.READY_TO_PROVE)
      return ProgressStatus.READY
    return ProgressStatus.COMPLETED
  }

  const getProveStep = () => ({
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
          : getProveStatus() === ProgressStatus.COMPLETED
            ? ProgressStatus.READY
            : ProgressStatus.NOT_READY,
    },
    status: getProveStatus(),
    transactionHash: withdrawal.proveTxHash,
  })

  const getClaimStep = () => ({
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
    status:
      withdrawal.status === MessageStatus.RELAYED
        ? ProgressStatus.COMPLETED
        : withdrawal.status === MessageStatus.READY_FOR_RELAY
          ? ProgressStatus.READY
          : ProgressStatus.NOT_READY,
    transactionHash: withdrawal.claimTxHash,
  })

  steps.push(getInitiateWithdrawStep())
  steps.push(getProveStep())
  steps.push(getClaimStep())

  return (
    <Operation
      amount={withdrawal.amount}
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
