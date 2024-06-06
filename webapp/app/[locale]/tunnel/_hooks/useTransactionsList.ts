import { MessageStatus } from '@eth-optimism/sdk'
import { TunnelHistoryContext } from 'app/context/tunnelHistoryContext'
import { useTranslations } from 'next-intl'
import { useContext } from 'react'
import { type Hash } from 'viem'
import { type UseWaitForTransactionReceiptReturnType } from 'wagmi'

import { useTunnelOperation } from './useTunnelState'

type UseTransactionsList = {
  expectedWithdrawSuccessfulMessageStatus?: MessageStatus
  inProgressMessage: string
  isOperating: boolean
  operation: string
  // tx receipt of the operation
  receipt: UseWaitForTransactionReceiptReturnType['data'] | undefined
  // used to show a tx error (there's a tx but reverted or failed)
  receiptError: Error | undefined
  successMessage: string
  // used to see if there was an error while confirming the Tx
  userConfirmationError: Error | undefined
  txHash: Hash | undefined
}
export const useTransactionsList = function ({
  expectedWithdrawSuccessfulMessageStatus,
  inProgressMessage,
  isOperating,
  operation,
  receipt,
  receiptError,
  successMessage,
  userConfirmationError,
  txHash,
}: UseTransactionsList) {
  const t = useTranslations()

  const { withdrawals } = useContext(TunnelHistoryContext)
  const { txHash: withdrawalTxHash } = useTunnelOperation()
  // deposits won't have a withdrawalTxHash and no requests will run
  const messageStatus = withdrawals.find(
    w => w.transactionHash === withdrawalTxHash,
  )?.status

  const transactionsList = []

  if (userConfirmationError) {
    // user rejected the request
    if (
      ['user rejected', 'denied transaction signature'].includes(
        userConfirmationError.message,
      )
    ) {
      transactionsList.push({
        id: operation,
        status: 'error',
        text: t('common.transaction-status.rejected'),
      })
    } else {
      // failed for some reason before sending the tx to the node
      // (there's no tx hash at this point)
      transactionsList.push({
        id: operation,
        status: 'error',
        text: t('common.transaction-status.error'),
      })
    }
  }

  if (txHash || (isOperating && !userConfirmationError)) {
    // tx failed for some reason
    if (receiptError) {
      transactionsList.push({
        id: operation,
        status: 'error',
        text: t('common.transaction-status.error'),
        txHash,
      })
    }
    // operation was successful if tx was confirmed
    // and status of operation is the expected one (withdrawal flow only)
    if (
      receipt?.status === 'success' &&
      (expectedWithdrawSuccessfulMessageStatus === undefined ||
        messageStatus >= expectedWithdrawSuccessfulMessageStatus)
    ) {
      transactionsList.push({
        id: operation,
        status: 'success',
        text: successMessage,
        txHash,
      })
    }
    // operation in progress
    if (!receipt || messageStatus < expectedWithdrawSuccessfulMessageStatus) {
      transactionsList.push({
        id: operation,
        status: 'loading',
        text: inProgressMessage,
        txHash,
      })
    }
  }
  return transactionsList
}
