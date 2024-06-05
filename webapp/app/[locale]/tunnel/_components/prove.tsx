import { MessageStatus } from '@eth-optimism/sdk'
import { TunnelHistoryContext } from 'app/context/tunnelHistoryContext'
import { WithdrawOperation } from 'app/context/tunnelHistoryContext/types'
import { bridgeableNetworks, hemi } from 'app/networks'
import { useChain } from 'hooks/useChain'
import { useTranslations } from 'next-intl'
import { useContext, useEffect, useState } from 'react'
import { Button } from 'ui-common/components/button'
import { formatNumber } from 'utils/format'
import { getL2TokenByBridgedAddress, getTokenByAddress } from 'utils/token'
import { Address, Hash, formatUnits, type Chain } from 'viem'

import { SubmitWhenConnectedToChain } from '../_components/submitWhenConnectedToChain'
import { useProveTransaction } from '../_hooks/useProveTransaction'
import { useTransactionsList } from '../_hooks/useTransactionsList'
import { useTunnelOperation, useTunnelState } from '../_hooks/useTunnelState'

import { ReviewWithdrawal } from './reviewWithdrawal'

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
  withdrawal: WithdrawOperation
}) {
  const t = useTranslations()

  const { status: messageStatus } = withdrawal

  const hasProveTxHash = !!proveWithdrawalTxHash
  const proveConfirmed =
    messageStatus >= MessageStatus.IN_CHALLENGE_PERIOD && hasProveTxHash

  return (
    <SubmitWhenConnectedToChain
      l1ChainId={l1ChainId}
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
  renderForm: (isRunningOperation: boolean) => React.ReactNode
  state: ReturnType<typeof useTunnelState>
}

export const Prove = function ({ state }: Props) {
  const { updateWithdrawalStatus, withdrawals } =
    useContext(TunnelHistoryContext)

  const { partialWithdrawal, resetStateAfterOperation, savePartialWithdrawal } =
    state

  // If coming from the Withdraw form, show the withdrawal transaction briefly
  // but if entering from the history, there's no need to show it
  const [showWithdrawalTx, setShowWithdrawalTx] = useState(
    !!partialWithdrawal?.withdrawalTxHash,
  )
  const [isProving, setIsProving] = useState(false)

  // https://github.com/BVM-priv/ui-monorepo/issues/158
  const l1ChainId = bridgeableNetworks[0].id

  const t = useTranslations()
  const { txHash } = useTunnelOperation()

  const fromChain = useChain(l1ChainId)

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

  useEffect(
    function hideWithdrawalTxFromTransactionList() {
      const timeoutId = setTimeout(function () {
        if (showWithdrawalTx) {
          setShowWithdrawalTx(false)
        }
      }, 7000)
      return () => clearTimeout(timeoutId)
    },
    [setShowWithdrawalTx, showWithdrawalTx],
  )

  useEffect(
    function updateWithdrawalStatusAfterConfirmation() {
      if (withdrawalProofReceipt?.status !== 'success') {
        return
      }
      if (withdrawal?.status === MessageStatus.IN_CHALLENGE_PERIOD) {
        return
      }
      updateWithdrawalStatus(withdrawal, MessageStatus.IN_CHALLENGE_PERIOD)
      savePartialWithdrawal({
        proveWithdrawalTxHash: withdrawalProofReceipt.transactionHash,
      })
    },
    [
      savePartialWithdrawal,
      txHash,
      updateWithdrawalStatus,
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
    <ReviewWithdrawal
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
