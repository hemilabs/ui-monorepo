import { MessageDirection, MessageStatus } from '@eth-optimism/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { bridgeableNetworks, hemi } from 'app/networks'
import { useChain } from 'hooks/useChain'
import { useAnyChainGetTransactionMessageStatus } from 'hooks/useL2Bridge'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
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
}: {
  isProving: boolean
  isReadyToProve: boolean
  l1ChainId: Chain['id']
  proveWithdrawalTxHash: Hash
}) {
  const t = useTranslations()

  const { txHash } = useTunnelOperation()
  const { messageStatus } = useAnyChainGetTransactionMessageStatus({
    direction: MessageDirection.L2_TO_L1,
    l1ChainId,
    transactionHash: txHash,
  })

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
  const { partialWithdrawal, savePartialWithdrawal } = state

  // If coming from the Withdraw form, show the withdrawal transaction briefly
  // but if entering from the history, there's no need to show it
  const [showWithdrawalTx, setShowWithdrawalTx] = useState(
    !!partialWithdrawal?.amount,
  )
  const [isProving, setIsProving] = useState(false)

  // https://github.com/BVM-priv/ui-monorepo/issues/158
  const l1ChainId = bridgeableNetworks[0].id

  const t = useTranslations()
  const queryClient = useQueryClient()
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

  // Save the Prove Tx Hash to show the tx status
  // while rendering the Claim component. This TX can't be recovered later
  // See https://github.com/ethereum-optimism/optimism/issues/9974
  // so when entering directly to that component, we just won't show it
  useEffect(
    function saveProveTxForClaim() {
      if (
        withdrawalProofReceipt?.status === 'success' &&
        !partialWithdrawal?.proveWithdrawalTxHash
      ) {
        savePartialWithdrawal({
          proveWithdrawalTxHash: withdrawalProofReceipt?.transactionHash,
        })
        queryClient.invalidateQueries({
          queryKey: [
            MessageDirection.L2_TO_L1,
            l1ChainId,
            txHash,
            'getMessageStatus',
          ],
        })
      }
    },
    [
      l1ChainId,
      partialWithdrawal,
      queryClient,
      savePartialWithdrawal,
      txHash,
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
    l1ChainId,
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
      getTokenByAddress(partialWithdrawal.l2Token as Address, hemi.id) ??
      getL2TokenByBridgedAddress(
        partialWithdrawal.l2Token as Address,
        l1ChainId,
      )
    return [
      {
        id: 'withdraw',
        status: 'success',
        text: t('tunnel-page.transaction-status.withdrawn', {
          fromInput: formatNumber(
            formatUnits(partialWithdrawal.amount.toBigInt(), token.decimals),
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
    />
  )

  return (
    <ReviewWithdrawal
      gas={gas}
      isRunningOperation={isProving}
      onSubmit={handleProve}
      submitButton={submitButton}
      transactionsList={
        showWithdrawalTx ? getPartialWithdrawTxList() : transactionsList
      }
      withdrawal={partialWithdrawal}
    />
  )
}
