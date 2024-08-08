import { MessageStatus } from '@eth-optimism/sdk'
import { BtcTransaction } from 'btc-wallet/unisat'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useTranslations } from 'next-intl'
import { type Hash, isHash } from 'viem'
import { type UseWaitForTransactionReceiptReturnType } from 'wagmi'

import { useTunnelOperation } from './useTunnelOperation'

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
  txHash: BtcTransaction | Hash | undefined
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

  const { withdrawals } = useTunnelHistory()
  const { txHash: withdrawalTxHash } = useTunnelOperation()

  const withdrawalMessageStatus = isHash(withdrawalTxHash)
    ? withdrawals.find(w => w.transactionHash === withdrawalTxHash)?.status
    : undefined

  const transactionsList = []

  if (userConfirmationError) {
    // user rejected the request
    if (
      ['user rejected', 'denied transaction signature'].includes(
        userConfirmationError.message?.toLowerCase(),
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
    // operation was successful if tx was confirmed
    // and status of operation is the expected one (withdrawal flow only)
    const evmConfirmation = receipt?.status === 'success'
    const btcConfirmation = receipt?.status.confirmed
    // tx failed for some reason
    if (receiptError) {
      transactionsList.push({
        id: operation,
        status: 'error',
        text: t('common.transaction-status.error'),
        txHash,
      })
    } else if (
      (evmConfirmation || btcConfirmation) &&
      (expectedWithdrawSuccessfulMessageStatus === undefined ||
        withdrawalMessageStatus >= expectedWithdrawSuccessfulMessageStatus)
    ) {
      transactionsList.push({
        id: operation,
        status: 'success',
        text: successMessage,
        txHash,
      })
    } else if (
      !receipt ||
      !receipt?.status.confirmed ||
      withdrawalMessageStatus < expectedWithdrawSuccessfulMessageStatus
    ) {
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
