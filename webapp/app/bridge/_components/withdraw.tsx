import { useBridgeState } from 'app/bridge/useBridgeState'
import { useTransactionsList } from 'app/bridge/useTransactionsList'
import { useWithdraw } from 'app/bridge/useWithdraw'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import dynamic from 'next/dynamic'
import { FormEvent, useEffect } from 'react'
import Skeleton from 'react-loading-skeleton'
import { formatNumber } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { formatUnits } from 'viem'
import { useConfig } from 'wagmi'

import { BridgeForm, canSubmit, getTotal } from './form'

const OperationButton = dynamic(
  () =>
    import('app/bridge/_components/OperationButton').then(
      mod => mod.OperationButton,
    ),
  {
    loading: () => <Skeleton className="h-14" />,
    ssr: false,
  },
)

const ReviewWithdraw = dynamic(
  () => import('components/reviewBox').then(mod => mod.ReviewWithdraw),
  {
    loading: () => <Skeleton className="h-48 w-full md:w-80" />,
    ssr: false,
  },
)

const TransactionStatus = dynamic(
  () =>
    import('components/transactionStatus').then(mod => mod.TransactionStatus),
  {
    ssr: false,
  },
)

type Props = {
  renderForm: (isRunningOperation: boolean) => React.ReactNode
  state: ReturnType<typeof useBridgeState>
}

export const Withdraw = function ({ renderForm, state }: Props) {
  const { fromInput, fromNetworkId, fromToken, updateFromInput, toToken } =
    state

  const { chains = [] } = useConfig()

  const operatesNativeToken = isNativeToken(fromToken)

  const fromChain = chains.find(c => c.id === fromNetworkId)

  const { balance: walletNativeTokenBalance } = useNativeTokenBalance(
    fromToken,
    operatesNativeToken,
  )

  const { balance: walletTokenBalance } = useTokenBalance(
    fromToken,
    !operatesNativeToken,
  )

  const canWithdraw = canSubmit({
    fromInput,
    fromToken,
    walletNativeTokenBalance,
    walletTokenBalance,
  })

  const {
    addTransaction,
    clearTransactionList,
    delayedClearTransactionList,
    transactionsList,
    updateTransaction,
  } = useTransactionsList()

  const {
    userWithdrawConfirmationStatus,
    withdraw,
    withdrawGasFees,
    withdrawStatus,
    withdrawTxHash,
  } = useWithdraw({
    canWithdraw,
    fromInput,
    fromToken,
    onSuccess() {
      updateTransaction({
        id: 'withdraw',
        status: 'success',
        text: `${fromInput} ${fromToken.symbol} withdrawn`,
      })
      updateFromInput('0')
      delayedClearTransactionList(7000)
    },
    toToken,
  })

  const handleWithdraw = function (e: FormEvent) {
    e.preventDefault()
    clearTransactionList()
    withdraw()
    addTransaction({
      id: 'withdraw',
      status: 'loading',
      text: `Withdrawing ${fromInput} ${fromToken.symbol}`,
    })
  }

  const totalWithdraw = getTotal({
    fees: withdrawGasFees,
    fromInput,
    fromToken,
  })

  useEffect(
    function updateWithdrawalTransactionsAfterUserReject() {
      if (userWithdrawConfirmationStatus === 'error') {
        updateTransaction({
          id: 'withdraw',
          status: 'error',
          text: 'Tx rejected',
        })
        return delayedClearTransactionList()
      }
      return undefined
    },
    [
      delayedClearTransactionList,
      userWithdrawConfirmationStatus,
      updateTransaction,
    ],
  )

  useEffect(
    function addWithdrawTxHashOnceAvailable() {
      if (withdrawTxHash) {
        updateTransaction({
          id: 'withdraw',
          txHash: withdrawTxHash,
        })
      }
    },
    [updateTransaction, withdrawTxHash],
  )

  useEffect(
    function updateTransactionsAfterWithdrawalError() {
      if (withdrawStatus === 'error') {
        updateTransaction({
          id: 'withdraw',
          status: 'error',
          text: 'Tx failed',
        })
        return delayedClearTransactionList()
      }
      return undefined
    },
    [delayedClearTransactionList, updateTransaction, withdrawStatus],
  )

  const isWithdrawing = [
    userWithdrawConfirmationStatus,
    withdrawStatus,
  ].includes('loading')

  return (
    <BridgeForm
      formContent={renderForm(isWithdrawing)}
      onSubmit={handleWithdraw}
      reviewOperation={
        <ReviewWithdraw
          canWithdraw={canWithdraw}
          gas={formatNumber(
            formatUnits(withdrawGasFees, fromChain?.nativeCurrency.decimals),
            3,
          )}
          gasSymbol={fromChain?.nativeCurrency.symbol}
          total={formatNumber(totalWithdraw, 3)}
          withdraw={formatNumber(fromInput, 3)}
          withdrawSymbol={fromToken.symbol}
        />
      }
      submitButton={
        <OperationButton
          disabled={!canWithdraw || isWithdrawing}
          text={isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
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
