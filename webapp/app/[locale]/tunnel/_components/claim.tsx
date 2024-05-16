import { MessageDirection, MessageStatus } from '@eth-optimism/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { bridgeableNetworks } from 'app/networks'
import { useChain } from 'hooks/useChain'
import {
  useAnyChainGetTransactionMessageStatus,
  useGetClaimWithdrawalTxHash,
} from 'hooks/useL2Bridge'
import { useTranslations } from 'next-intl'
import { ReactNode, useEffect, useState } from 'react'
import { Button } from 'ui-common/components/button'
import { Chain, Hash, formatUnits } from 'viem'
import { useChains } from 'wagmi'

import { SubmitWhenConnectedToChain } from '../_components/submitWhenConnectedToChain'
import { useClaimTransaction } from '../_hooks/useClaimTransaction'
import { useTransactionsList } from '../_hooks/useTransactionsList'
import { useTunnelOperation, useTunnelState } from '../_hooks/useTunnelState'

import { ReviewWithdrawal } from './reviewWithdrawal'

const SubmitButton = function ({
  claimTxHash: inMemoryClaimTxHash,
  l1ChainId,
  isClaiming,
  isReadyToClaim,
}: {
  claimTxHash: Hash | undefined
  l1ChainId: Chain['id']
  isClaiming: boolean
  isReadyToClaim: boolean
}) {
  const t = useTranslations()
  const chains = useChains()
  const { txHash } = useTunnelOperation()

  const { claimTxHash } = useGetClaimWithdrawalTxHash(l1ChainId, txHash)
  const { messageStatus } = useAnyChainGetTransactionMessageStatus({
    direction: MessageDirection.L2_TO_L1,
    l1ChainId,
    transactionHash: txHash,
  })

  const hasClaimTxHash = !!inMemoryClaimTxHash || !!claimTxHash

  // Even though the Tx is confirmed, it takes a while to the OP-SDK
  // to confirm that the message was relayed, even after revalidating the queries
  // so it is better to check for this instead of the existence of the claimTxHash
  const claimConfirmed =
    messageStatus === MessageStatus.RELAYED && hasClaimTxHash

  if (claimConfirmed) {
    const chain = chains.find(c => c.id === l1ChainId)
    return (
      <a
        href={`${chain.blockExplorers.default.url}/tx/${
          inMemoryClaimTxHash ?? claimTxHash
        }`}
        rel="noopener noreferrer"
        target="_blank"
      >
        <Button type="button">{t('common.view')}</Button>
      </a>
    )
  }
  return (
    <SubmitWhenConnectedToChain
      l1ChainId={l1ChainId}
      submitButton={
        <Button
          disabled={!isReadyToClaim || isClaiming || claimConfirmed}
          type="submit"
        >
          {t(
            `tunnel-page.submit-button.${
              isClaiming || (!claimConfirmed && hasClaimTxHash)
                ? 'claiming-withdrawal'
                : 'claim-withdrawal'
            }`,
          )}
        </Button>
      }
    />
  )
}

type Props = {
  renderForm: (isRunningOperation: boolean) => ReactNode
  state: ReturnType<typeof useTunnelState>
}

export const Claim = function ({ state }: Props) {
  const { partialWithdrawal, resetStateAfterOperation } = state
  // If coming from the Prove form, show the prove transaction briefly
  // but if entering from the history, there's no need to show it
  const [showProveWithdrawalTx, setShowProveWithdrawalTx] = useState(
    !!partialWithdrawal?.proveWithdrawalTxHash,
  )
  const [isClaiming, setIsClaiming] = useState(false)
  const [savedClaimTxHash, setSavedClaimTxHash] = useState<Hash | undefined>()

  // https://github.com/BVM-priv/ui-monorepo/issues/158
  const l1ChainId = bridgeableNetworks[0].id

  const { txHash } = useTunnelOperation()
  const queryClient = useQueryClient()
  const t = useTranslations()

  const fromChain = useChain(l1ChainId)

  const {
    claimWithdrawal,
    claimWithdrawalError,
    claimWithdrawalReceipt,
    claimWithdrawalReceiptError,
    claimWithdrawalTokenGasFees,
    clearClaimWithdrawalState,
    isReadyToClaim,
  } = useClaimTransaction({
    l1ChainId,
    withdrawTxHash: txHash,
  })

  useEffect(
    function hideProveTxFromTransactionList() {
      const timeoutId = setTimeout(function () {
        if (showProveWithdrawalTx) {
          setShowProveWithdrawalTx(false)
        }
      }, 7000)
      return () => clearTimeout(timeoutId)
    },
    [setShowProveWithdrawalTx, showProveWithdrawalTx],
  )

  useEffect(
    function handleClaimSuccess() {
      if (claimWithdrawalReceipt?.status === 'success' && !savedClaimTxHash) {
        setSavedClaimTxHash(claimWithdrawalReceipt.transactionHash)
        queryClient.invalidateQueries({
          queryKey: [
            MessageDirection.L2_TO_L1,
            l1ChainId,
            txHash,
            'getMessageStatus',
          ],
        })
        setIsClaiming(false)
        const timeoutId = setTimeout(clearClaimWithdrawalState, 7000)
        return () => clearTimeout(timeoutId)
      }

      return undefined
    },
    [
      claimWithdrawalReceipt,
      clearClaimWithdrawalState,
      l1ChainId,
      queryClient,
      savedClaimTxHash,
      setSavedClaimTxHash,
      txHash,
    ],
  )

  useEffect(
    function handleClaimErrors() {
      if (isClaiming && (claimWithdrawalError || claimWithdrawalReceiptError)) {
        const timeoutId = setTimeout(clearClaimWithdrawalState, 7000)
        setIsClaiming(false)
        return () => clearTimeout(timeoutId)
      }
      return undefined
    },
    [
      claimWithdrawalError,
      claimWithdrawalReceiptError,
      clearClaimWithdrawalState,
      isClaiming,
      isReadyToClaim,
      setIsClaiming,
    ],
  )

  const handleClaim = function () {
    if (!isReadyToClaim) {
      return
    }
    clearClaimWithdrawalState()
    claimWithdrawal()
    setIsClaiming(true)
  }

  const transactionsList = useTransactionsList({
    expectedWithdrawSuccessfulMessageStatus: MessageStatus.RELAYED,
    inProgressMessage: t('tunnel-page.transaction-status.claiming-withdrawal'),
    isOperating: isClaiming,
    l1ChainId,
    operation: 'claim',
    receipt: claimWithdrawalReceipt,
    receiptError: claimWithdrawalReceiptError,
    successMessage: t('tunnel-page.transaction-status.withdrawal-claimed'),
    txHash: savedClaimTxHash,
    userConfirmationError: claimWithdrawalError,
  })

  const gas = {
    amount: formatUnits(
      claimWithdrawalTokenGasFees,
      fromChain?.nativeCurrency.decimals,
    ),
    label: t('common.network-gas-fee', { network: fromChain?.name }),
    symbol: fromChain?.nativeCurrency.symbol,
  }

  const submitButton = (
    <SubmitButton
      claimTxHash={savedClaimTxHash}
      isClaiming={isClaiming}
      isReadyToClaim={isReadyToClaim}
      l1ChainId={l1ChainId}
    />
  )

  return (
    <ReviewWithdrawal
      gas={gas}
      isRunningOperation={isClaiming}
      onClose={resetStateAfterOperation}
      onSubmit={handleClaim}
      submitButton={submitButton}
      transactionsList={
        showProveWithdrawalTx
          ? [
              {
                id: 'prove',
                status: 'success',
                text: t('tunnel-page.transaction-status.withdrawal-proved'),
                txHash: partialWithdrawal.proveWithdrawalTxHash,
              },
            ]
          : transactionsList
      }
      withdrawal={partialWithdrawal}
    />
  )
}
