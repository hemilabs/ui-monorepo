import { MessageStatus } from '@eth-optimism/sdk'
import { Button } from 'components/button'
import { useChain } from 'hooks/useChain'
import { useHemi } from 'hooks/useHemi'
import { useNetworks } from 'hooks/useNetworks'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { EvmWithdrawOperation } from 'types/tunnel'
import { formatNumber } from 'utils/format'
import { getL2TokenByBridgedAddress, getTokenByAddress } from 'utils/token'
import { Address, Hash, formatUnits, type Chain } from 'viem'

import { SubmitWhenConnectedToChain } from '../_components/submitWhenConnectedToChain'
import { useProveTransaction } from '../_hooks/useProveTransaction'
import { useShowTransactionFromPreviousStep } from '../_hooks/useShowTransactionFromPreviousStep'
import { useTransactionsList } from '../_hooks/useTransactionsList'
import { useTunnelOperation } from '../_hooks/useTunnelOperation'
import { useTunnelState } from '../_hooks/useTunnelState'

import { ReviewEvmWithdrawal } from './reviewOperation/reviewEvmWithdrawal'

const SubmitButton = function ({
  isProving,
  isReadyToProve,
  l1ChainId,
  proveWithdrawalTxHash,
  withdrawal,
}: {
  isProving: boolean
  isReadyToProve: boolean
  l1ChainId: Chain['id']
  proveWithdrawalTxHash: Hash
  withdrawal: EvmWithdrawOperation
}) {
  const t = useTranslations()

  const { status: messageStatus } = withdrawal

  const hasProveTxHash = !!proveWithdrawalTxHash
  const proveConfirmed =
    messageStatus >= MessageStatus.IN_CHALLENGE_PERIOD && hasProveTxHash

  return (
    <SubmitWhenConnectedToChain
      chainId={l1ChainId}
      submitButton={
        <Button
          disabled={!isReadyToProve || isProving || proveConfirmed}
          type="submit"
        >
          {t(
            `tunnel-page.submit-button.${
              isProving || (!proveConfirmed && hasProveTxHash)
                ? 'proving-withdrawal'
                : 'prove-withdrawal'
            }`,
          )}
        </Button>
      }
    />
  )
}
type Props = {
  state: ReturnType<typeof useTunnelState>
}

export const Prove = function ({ state }: Props) {
  const { evmRemoteNetworks } = useNetworks()
  const { updateWithdrawal, withdrawals } = useTunnelHistory()

  const { partialWithdrawal, resetStateAfterOperation, savePartialWithdrawal } =
    state

  const [isProving, setIsProving] = useState(false)

  // https://github.com/hemilabs/ui-monorepo/issues/158
  const l1ChainId = evmRemoteNetworks[0].id

  const t = useTranslations()
  const txHash = useTunnelOperation().txHash as Hash

  const fromChain = useChain(l1ChainId)
  const hemi = useHemi()

  const {
    clearProveWithdrawalState,
    isReadyToProve,
    proveWithdrawal,
    proveWithdrawalError,
    withdrawalProofReceipt,
    withdrawalProofReceiptError,
    proveWithdrawalTokenGasFees,
    proveWithdrawalTxHash,
  } = useProveTransaction({
    l1ChainId,
    withdrawTxHash: txHash,
  })

  const withdrawal = withdrawals.find(w => w.transactionHash === txHash)

  // If coming from the Withdraw form, show the withdrawal transaction briefly
  // but if entering from the history, there's no need to show it
  const showWithdrawalTx = useShowTransactionFromPreviousStep(
    partialWithdrawal?.withdrawalTxHash,
  )

  useEffect(
    function updateWithdrawalAfterConfirmation() {
      if (withdrawalProofReceipt?.status !== 'success') {
        return
      }
      if (withdrawal?.status === MessageStatus.IN_CHALLENGE_PERIOD) {
        return
      }
      updateWithdrawal(withdrawal, {
        status: MessageStatus.IN_CHALLENGE_PERIOD,
      })
      savePartialWithdrawal({
        proveWithdrawalTxHash: withdrawalProofReceipt.transactionHash,
      })
    },
    [
      savePartialWithdrawal,
      txHash,
      updateWithdrawal,
      withdrawal,
      withdrawals,
      withdrawalProofReceipt,
    ],
  )

  useEffect(
    function handleProveErrors() {
      if (isProving && (proveWithdrawalError || withdrawalProofReceiptError)) {
        const timeoutId = setTimeout(clearProveWithdrawalState, 7000)
        setIsProving(false)
        return () => clearTimeout(timeoutId)
      }
      return undefined
    },
    [
      clearProveWithdrawalState,
      isProving,
      isReadyToProve,
      setIsProving,
      proveWithdrawalError,
      withdrawalProofReceiptError,
    ],
  )

  const handleProve = function () {
    if (!isReadyToProve) {
      return
    }
    clearProveWithdrawalState()
    proveWithdrawal()
    setIsProving(true)
  }

  const transactionsList = useTransactionsList({
    expectedWithdrawSuccessfulMessageStatus: MessageStatus.IN_CHALLENGE_PERIOD,
    inProgressMessage: t('tunnel-page.transaction-status.proving-withdrawal'),
    isOperating: isProving,
    operation: 'prove',
    receipt: withdrawalProofReceipt,
    receiptError: withdrawalProofReceiptError,
    successMessage: t('tunnel-page.transaction-status.withdrawal-proved'),
    txHash: proveWithdrawalTxHash,
    userConfirmationError: proveWithdrawalError,
  })

  const gas = {
    amount: formatUnits(
      proveWithdrawalTokenGasFees,
      fromChain?.nativeCurrency.decimals,
    ),
    label: t('common.network-gas-fee', { network: fromChain?.name }),
    symbol: fromChain?.nativeCurrency.symbol,
  }

  const getPartialWithdrawTxList = function () {
    const token =
      getTokenByAddress(withdrawal.l2Token as Address, hemi.id) ??
      getL2TokenByBridgedAddress(withdrawal.l2Token as Address, l1ChainId)
    return [
      {
        id: 'withdraw',
        status: 'success',
        text: t('tunnel-page.transaction-status.withdrawn', {
          fromInput: formatNumber(
            formatUnits(BigInt(withdrawal.amount), token.decimals),
            3,
          ),
          symbol: token.symbol,
        }),
        txHash,
      },
    ]
  }

  const submitButton = (
    <SubmitButton
      isProving={isProving}
      isReadyToProve={isReadyToProve}
      l1ChainId={l1ChainId}
      proveWithdrawalTxHash={partialWithdrawal?.proveWithdrawalTxHash}
      withdrawal={withdrawal}
    />
  )

  return (
    <ReviewEvmWithdrawal
      gas={gas}
      isRunningOperation={isProving}
      onClose={resetStateAfterOperation}
      onSubmit={handleProve}
      submitButton={submitButton}
      transactionsList={
        showWithdrawalTx && partialWithdrawal
          ? getPartialWithdrawTxList()
          : transactionsList
      }
    />
  )
}
