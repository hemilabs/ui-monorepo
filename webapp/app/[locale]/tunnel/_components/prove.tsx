import { NotificationBox } from 'components/notificationBox'
import {
  ReviewWithdraw,
  WithdrawProgress,
} from 'components/reviewBox/reviewWithdraw'
import { TransactionStatus } from 'components/transactionStatus'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Button } from 'ui-common/components/button'
import { formatNumber } from 'utils/format'
import { type Address, formatUnits, type Chain, Hash } from 'viem'
import {
  type UseWaitForTransactionReceiptReturnType,
  useConfig,
  useSwitchChain,
} from 'wagmi'

import { useBridgeState } from '../_hooks/useBridgeState'
import { useProveTransaction } from '../_hooks/useProveTransaction'

import { BridgeForm } from './form'

const SubmitButton = function ({
  isProving,
  isReadyToProve,
  l1ChainId,
}: {
  isProving: boolean
  isReadyToProve: boolean
  l1ChainId: Chain['id']
}) {
  const { chains } = useConfig()
  const { switchChain } = useSwitchChain()

  const t = useTranslations()

  const connectedToL1 = useIsConnectedToExpectedNetwork(l1ChainId)
  const targetChain = chains.find(c => c.id === l1ChainId)

  const switchToL1 = () => switchChain({ chainId: l1ChainId })

  return (
    <>
      {connectedToL1 && (
        <Button disabled={!isReadyToProve || isProving} type="submit">
          {t(
            `bridge-page.submit-button.${
              isProving ? 'proving-withdrawal' : 'prove-withdrawal'
            }`,
          )}
        </Button>
      )}
      {!connectedToL1 && (
        <>
          <NotificationBox
            backgroundColor="bg-orange-100"
            text={t('bridge-page.form.switch-to-prove', {
              network: targetChain.name,
            })}
          />
          <Button onClick={switchToL1} type="button">
            {t('common.switch-to-network', { network: targetChain.name })}
          </Button>
        </>
      )}
    </>
  )
}

const useTransactionList = function ({
  isProving,
  proveWithdrawalError,
  proveWithdrawalTxHash,
  showWithdrawalTx,
  withdrawalProofReceipt,
  withdrawalProofReceiptError,
  withdrawAmount,
  withdrawSymbol,
  withdrawTxHash,
}: {
  isProving: boolean
  proveWithdrawalError: Error | undefined
  proveWithdrawalTxHash: Hash | undefined
  showWithdrawalTx: boolean
  withdrawalProofReceipt:
    | UseWaitForTransactionReceiptReturnType['data']
    | undefined
  withdrawalProofReceiptError: Error | undefined
  withdrawAmount: string
  withdrawSymbol: string
  withdrawTxHash: Address
}) {
  const t = useTranslations()
  const transactionsList = []

  if (showWithdrawalTx) {
    transactionsList.push({
      id: 'withdraw',
      status: 'success',
      text: t('bridge-page.transaction-status.withdrawn', {
        fromInput: withdrawAmount,
        symbol: withdrawSymbol,
      }),
      txHash: withdrawTxHash,
    })
    return transactionsList
  }

  if (proveWithdrawalError) {
    // user rejected the request
    if (
      ['user rejected', 'denied transaction signature'].includes(
        proveWithdrawalError.message,
      )
    ) {
      transactionsList.push({
        id: 'prove',
        status: 'error',
        text: t('common.transaction-status.rejected'),
      })
    } else {
      // failed for some reason before sending the tx to the node (no tx hash)
      transactionsList.push({
        id: 'prove',
        status: 'error',
        text: t('common.transaction-status.error'),
      })
    }
  }

  if (proveWithdrawalTxHash || (isProving && !proveWithdrawalError)) {
    // proving failed for some reason
    if (withdrawalProofReceiptError) {
      transactionsList.push({
        id: 'prove',
        status: 'error',
        text: t('common.transaction-status.error'),
        txHash: proveWithdrawalTxHash,
      })
    }
    // proving was successful
    if (withdrawalProofReceipt?.status === 'success') {
      transactionsList.push({
        id: 'prove',
        status: 'success',
        text: t('bridge-page.transaction-status.withdrawal-proved'),
        txHash: proveWithdrawalTxHash,
      })
    }
    // proving in progress
    if (!withdrawalProofReceipt) {
      transactionsList.push({
        id: 'prove',
        status: 'loading',
        text: t('bridge-page.transaction-status.proving-withdrawal'),
        txHash: proveWithdrawalTxHash,
      })
    }
  }

  return transactionsList
}

type Props = {
  renderForm: (isRunningOperation: boolean) => React.ReactNode
  state: ReturnType<typeof useBridgeState> & { operation: 'prove' }
}

export const Prove = function ({ renderForm, state }: Props) {
  // initially show the Withdraw Tx hash, because this component renders as soon as it is
  // confirmed, so after some time, we must hide it!
  const [showWithdrawalTx, setShowWithdrawalTx] = useState(true)
  // use this to be able to show state boxes before user confirmation (mutation isn't finished)
  const [withdrawProgress, setWithdrawProgress] = useState<WithdrawProgress>(
    WithdrawProgress.WITHDRAW_NOT_PUBLISHED,
  )

  const { chains = [] } = useConfig()
  const {
    waitForClaimAvailable,
    withdrawAmount,
    withdrawL1NetworkId,
    withdrawSymbol,
    withdrawTxHash,
  } = state

  const fromChain = chains.find(c => c.id === withdrawL1NetworkId)

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
    l1ChainId: withdrawL1NetworkId,
    withdrawTxHash,
  })

  useEffect(
    function updateWithdrawProgressOnceReady() {
      if (
        isReadyToProve &&
        withdrawProgress === WithdrawProgress.WITHDRAW_NOT_PUBLISHED
      ) {
        setWithdrawProgress(WithdrawProgress.READY_TO_PROVE)
      }
    },
    [isReadyToProve, setWithdrawProgress, withdrawProgress],
  )

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
    function goToWaitToLaterClaimForm() {
      if (withdrawalProofReceipt?.status === 'success') {
        clearProveWithdrawalState()
        waitForClaimAvailable(withdrawalProofReceipt.transactionHash)
      }
      return undefined
    },
    [
      clearProveWithdrawalState,
      setWithdrawProgress,
      waitForClaimAvailable,
      withdrawalProofReceipt,
    ],
  )

  useEffect(
    function handleProveErrors() {
      if (
        withdrawProgress === WithdrawProgress.PROVING &&
        (proveWithdrawalError || withdrawalProofReceiptError)
      ) {
        const timeoutId = setTimeout(clearProveWithdrawalState, 7000)
        setWithdrawProgress(
          isReadyToProve
            ? WithdrawProgress.READY_TO_PROVE
            : WithdrawProgress.WITHDRAW_NOT_PUBLISHED,
        )
        return () => clearTimeout(timeoutId)
      }
      return undefined
    },
    [
      clearProveWithdrawalState,
      isReadyToProve,
      setWithdrawProgress,
      proveWithdrawalError,
      withdrawalProofReceiptError,
      withdrawProgress,
    ],
  )

  const handleProve = function () {
    if (!isReadyToProve) {
      return
    }
    clearProveWithdrawalState()
    proveWithdrawal()
    setWithdrawProgress(WithdrawProgress.PROVING)
  }

  const isProving = withdrawProgress === WithdrawProgress.PROVING

  const transactionsList = useTransactionList({
    isProving,
    proveWithdrawalError,
    proveWithdrawalTxHash,
    showWithdrawalTx,
    withdrawalProofReceipt,
    withdrawalProofReceiptError,
    withdrawAmount,
    withdrawSymbol,
    withdrawTxHash,
  })

  return (
    <BridgeForm
      formContent={renderForm(isProving)}
      onSubmit={handleProve}
      reviewOperation={
        <ReviewWithdraw
          gas={formatUnits(
            proveWithdrawalTokenGasFees,
            fromChain?.nativeCurrency.decimals,
          )}
          gasSymbol={fromChain?.nativeCurrency.symbol}
          operation="prove"
          progress={withdrawProgress}
          proveWithdrawalTxHash={proveWithdrawalTxHash}
          toWithdraw={formatNumber(withdrawAmount, 3)}
          withdrawSymbol={withdrawSymbol}
          withdrawTxHash={withdrawTxHash}
        />
      }
      submitButton={
        <SubmitButton
          isProving={isProving}
          isReadyToProve={isReadyToProve}
          l1ChainId={withdrawL1NetworkId}
        />
      }
      transactionStatus={
        <>
          {transactionsList.map(transaction => (
            <TransactionStatus
              key={transaction.id}
              status={transaction.status}
              text={transaction.text}
              txHash={transaction.txHash}
            />
          ))}
        </>
      }
    />
  )
}
