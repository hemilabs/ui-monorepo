import {
  ReviewWithdraw,
  WithdrawProgress,
} from 'components/reviewBox/reviewWithdraw'
import { useTranslations } from 'next-intl'
import { ReactNode, useEffect, useState } from 'react'
import { Button } from 'ui-common/components/button'
import { formatNumber } from 'utils/format'
import { Chain, formatUnits } from 'viem'
import { useConfig } from 'wagmi'

import { SubmitWhenConnectedToChain } from '../_components/submitWhenConnectedToChain'
import { useClaimTransaction } from '../_hooks/useClaimTransaction'
import { useTransactionsList } from '../_hooks/useTransactionsList'
import { useTunnelState } from '../_hooks/useTunnelState'

import { TunnelForm } from './form'

const SubmitButton = function ({
  l1ChainId,
  isClaiming,
  isReadyToClaim,
  withdrawProgress,
}: {
  l1ChainId: Chain['id']
  isClaiming: boolean
  isReadyToClaim: boolean
  withdrawProgress: WithdrawProgress
}) {
  const t = useTranslations()
  return (
    <SubmitWhenConnectedToChain
      l1ChainId={l1ChainId}
      submitButton={
        <Button
          disabled={
            !isReadyToClaim ||
            isClaiming ||
            withdrawProgress !== WithdrawProgress.READY_TO_CLAIM
          }
          type="submit"
        >
          {t(
            `tunnel-page.submit-button.${
              isClaiming ? 'claiming-withdrawal' : 'claim-withdrawal'
            }`,
          )}
        </Button>
      }
    />
  )
}

type Props = {
  renderForm: (isRunningOperation: boolean) => ReactNode
  state: ReturnType<typeof useTunnelState> & { operation: 'claim' }
}

export const Claim = function ({ renderForm, state }: Props) {
  // initially show the Withdraw Tx hash, because this component renders as soon as it is
  // confirmed, so after some time, we must hide it!
  const [showProveWithdrawalTx, setShowProveWithdrawalTx] = useState(true)
  const [withdrawProgress, setWithdrawProgress] = useState<WithdrawProgress>(
    WithdrawProgress.WAITING_FOR_CLAIM_ENABLED,
  )

  const t = useTranslations()

  const { chains = [] } = useConfig()

  const {
    proveWithdrawalTxHash,
    withdrawAmount,
    withdrawL1NetworkId,
    withdrawSymbol,
    withdrawTxHash,
  } = state

  const fromChain = chains.find(c => c.id === withdrawL1NetworkId)

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
    l1ChainId: withdrawL1NetworkId,
    withdrawTxHash,
  })

  useEffect(
    function updateWithdrawProgressOnceReady() {
      if (
        isReadyToClaim &&
        withdrawProgress === WithdrawProgress.WAITING_FOR_CLAIM_ENABLED
      ) {
        setWithdrawProgress(WithdrawProgress.READY_TO_CLAIM)
      }
    },
    [isReadyToClaim, setWithdrawProgress, withdrawProgress],
  )

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
      if (
        claimWithdrawalReceipt?.status === 'success' &&
        withdrawProgress !== WithdrawProgress.CLAIMED
      ) {
        setWithdrawProgress(WithdrawProgress.CLAIMED)
      }
      if (withdrawProgress === WithdrawProgress.CLAIMED) {
        const timeoutId = setTimeout(function () {
          clearClaimWithdrawalState()
        }, 7000)
        return () => clearTimeout(timeoutId)
      }

      return undefined
    },
    [
      claimWithdrawalReceipt,
      clearClaimWithdrawalState,
      setWithdrawProgress,
      withdrawProgress,
    ],
  )

  useEffect(
    function handleClaimErrors() {
      if (
        withdrawProgress === WithdrawProgress.CLAIMING &&
        (claimWithdrawalError || claimWithdrawalReceiptError)
      ) {
        const timeoutId = setTimeout(clearClaimWithdrawalState, 7000)
        setWithdrawProgress(
          isReadyToClaim
            ? WithdrawProgress.READY_TO_CLAIM
            : WithdrawProgress.WAITING_FOR_CLAIM_ENABLED,
        )
        return () => clearTimeout(timeoutId)
      }
      return undefined
    },
    [
      claimWithdrawalError,
      claimWithdrawalReceiptError,
      clearClaimWithdrawalState,
      isReadyToClaim,
      setWithdrawProgress,
      withdrawProgress,
    ],
  )

  const handleClaim = function () {
    if (!isReadyToClaim) {
      return
    }
    clearClaimWithdrawalState()
    claimWithdrawal()
    setWithdrawProgress(WithdrawProgress.CLAIMING)
  }

  const isClaiming = withdrawProgress === WithdrawProgress.CLAIMING

  const transactionsList = useTransactionsList({
    inProgressMessage: t('tunnel-page.transaction-status.claiming-withdrawal'),
    isOperating: isClaiming,
    operation: 'claim',
    receipt: claimWithdrawalReceipt,
    receiptError: claimWithdrawalReceiptError,
    successMessage: t('tunnel-page.transaction-status.withdrawal-claimed'),
    txHash: claimWithdrawalTxHash,
    userConfirmationError: claimWithdrawalError,
  })

  return (
    <TunnelForm
      formContent={renderForm(isClaiming)}
      onSubmit={handleClaim}
      reviewOperation={
        <ReviewWithdraw
          claimWithdrawalTxHash={claimWithdrawalTxHash}
          gas={formatUnits(
            claimWithdrawalTokenGasFees,
            fromChain?.nativeCurrency.decimals,
          )}
          gasSymbol={fromChain?.nativeCurrency.symbol}
          l1ChainId={withdrawL1NetworkId}
          operation="claim"
          progress={withdrawProgress}
          proveWithdrawalTxHash={proveWithdrawalTxHash}
          toWithdraw={formatNumber(withdrawAmount, 3)}
          withdrawSymbol={withdrawSymbol}
          withdrawTxHash={withdrawTxHash}
        />
      }
      submitButton={
        <SubmitButton
          isClaiming={isClaiming}
          isReadyToClaim={isReadyToClaim}
          l1ChainId={withdrawL1NetworkId}
          withdrawProgress={withdrawProgress}
        />
      }
      transactionsList={
        showProveWithdrawalTx
          ? [
              {
                id: 'prove',
                status: 'success',
                text: t('tunnel-page.transaction-status.withdrawal-proved'),
                txHash: proveWithdrawalTxHash,
              },
            ]
          : transactionsList
      }
    />
  )
}
