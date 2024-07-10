import { MessageStatus } from '@eth-optimism/sdk'
import { TunnelHistoryContext } from 'app/context/tunnelHistoryContext'
import { EvmWithdrawOperation } from 'app/context/tunnelHistoryContext/types'
import { evmRemoteNetworks } from 'app/networks'
import { useChain } from 'hooks/useChain'
import { useGetClaimWithdrawalTxHash } from 'hooks/useL2Bridge'
import { useTranslations } from 'next-intl'
import { useContext, useEffect, useState } from 'react'
import { Button } from 'ui-common/components/button'
import { Chain, Hash, formatUnits } from 'viem'

import { SubmitWhenConnectedToChain } from '../_components/submitWhenConnectedToChain'
import { useClaimTransaction } from '../_hooks/useClaimTransaction'
import { useTransactionsList } from '../_hooks/useTransactionsList'
import { useTunnelOperation } from '../_hooks/useTunnelOperation'
import { useTunnelState } from '../_hooks/useTunnelState'

import { ReviewEvmWithdrawal } from './reviewOperation/reviewEvmWithdrawal'

const SubmitButton = function ({
  claimTxHash: inMemoryClaimTxHash,
  l1ChainId,
  isClaiming,
  isReadyToClaim,
  withdrawal,
}: {
  claimTxHash: Hash | undefined
  l1ChainId: Chain['id']
  isClaiming: boolean
  isReadyToClaim: boolean
  withdrawal: EvmWithdrawOperation
}) {
  const t = useTranslations()
  const txHash = useTunnelOperation().txHash as Hash

  const { claimTxHash } = useGetClaimWithdrawalTxHash(l1ChainId, txHash)
  const { status: messageStatus } = withdrawal

  const hasClaimTxHash = !!inMemoryClaimTxHash || !!claimTxHash

  // Even though the Tx is confirmed, it takes a while to the OP-SDK
  // to confirm that the message was relayed, even after revalidating the queries
  // so it is better to check for this instead of the existence of the claimTxHash
  const claimConfirmed =
    messageStatus === MessageStatus.RELAYED && hasClaimTxHash

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
  state: ReturnType<typeof useTunnelState>
}

export const Claim = function ({ state }: Props) {
  const { updateWithdrawal, withdrawals } = useContext(TunnelHistoryContext)
  const { partialWithdrawal, resetStateAfterOperation, savePartialWithdrawal } =
    state
  // If coming from the Prove form, show the prove transaction briefly
  // but if entering from the history, there's no need to show it
  const [showProveWithdrawalTx, setShowProveWithdrawalTx] = useState(
    !!partialWithdrawal?.proveWithdrawalTxHash,
  )
  const [isClaiming, setIsClaiming] = useState(false)

  // https://github.com/BVM-priv/ui-monorepo/issues/158
  const l1ChainId = evmRemoteNetworks[0].id

  const txHash = useTunnelOperation().txHash as Hash
  const t = useTranslations()

  const fromChain = useChain(l1ChainId)

  const {
    claimWithdrawal,
    claimWithdrawalError,
    claimWithdrawalReceipt,
    claimWithdrawalReceiptError,
    claimWithdrawalTokenGasFees,
    claimWithdrawalTxHash,
    clearClaimWithdrawalState,
    isReadyToClaim,
  } = useClaimTransaction({
    l1ChainId,
    withdrawTxHash: txHash,
  })

  const withdrawal = withdrawals.find(w => w.transactionHash === txHash)

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
    function updateWithdrawalAfterConfirmation() {
      if (claimWithdrawalReceipt?.status !== 'success') {
        return
      }

      if (withdrawal?.status === MessageStatus.RELAYED) {
        return
      }
      updateWithdrawal(withdrawal, { status: MessageStatus.RELAYED })
      savePartialWithdrawal({
        claimWithdrawalTxHash: claimWithdrawalReceipt.transactionHash,
      })
    },
    [
      claimWithdrawalReceipt,
      savePartialWithdrawal,
      txHash,
      updateWithdrawal,
      withdrawal,
      withdrawals,
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
    operation: 'claim',
    receipt: claimWithdrawalReceipt,
    receiptError: claimWithdrawalReceiptError,
    successMessage: t('tunnel-page.transaction-status.withdrawal-claimed'),
    txHash: claimWithdrawalTxHash,
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
      claimTxHash={claimWithdrawalTxHash}
      isClaiming={isClaiming}
      isReadyToClaim={isReadyToClaim}
      l1ChainId={l1ChainId}
      withdrawal={withdrawal}
    />
  )

  return (
    <ReviewEvmWithdrawal
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
                txHash: partialWithdrawal?.proveWithdrawalTxHash,
              },
            ]
          : transactionsList
      }
    />
  )
}
