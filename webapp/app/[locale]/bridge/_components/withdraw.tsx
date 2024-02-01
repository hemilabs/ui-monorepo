import { useBridgeState } from 'app/[locale]/bridge/useBridgeState'
import { useTransactionsList } from 'app/[locale]/bridge/useTransactionsList'
import { useWithdraw } from 'app/[locale]/bridge/useWithdraw'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { FormEvent, useEffect } from 'react'
import Skeleton from 'react-loading-skeleton'
import { formatNumber } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { formatUnits } from 'viem'
import { useConfig, useNetwork } from 'wagmi'

import { BridgeForm, canSubmit, getTotal } from './form'

const OperationButton = dynamic(
  () =>
    import('app/[locale]/bridge/_components/OperationButton').then(
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
  const t = useTranslations()
  const { fromInput, fromNetworkId, fromToken, updateFromInput, toToken } =
    state

  const { chains = [] } = useConfig()
  const { chain } = useNetwork()

  const operatesNativeToken = isNativeToken(fromToken)

  const fromChain = chains.find(c => c.id === fromNetworkId)

  const { balance: walletNativeTokenBalance } = useNativeTokenBalance(
    fromToken.chainId,
  )

  const { balance: walletTokenBalance } = useTokenBalance(
    fromToken,
    !operatesNativeToken,
  )

  const canWithdraw = canSubmit({
    chainId: chain?.id,
    fromInput,
    fromNetworkId,
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
    onError() {
      updateTransaction({
        id: 'withdraw',
        status: 'error',
        text: t('common.transaction-status.error'),
      })
      delayedClearTransactionList()
    },
    onSuccess() {
      updateTransaction({
        id: 'withdraw',
        status: 'success',
        text: t('bridge-page.transaction-status.withdrawn', {
          fromInput,
          fromToken: fromToken.symbol,
        }),
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
      text: t('bridge-page.transaction-status.withdrawing', {
        fromInput,
        fromToken: fromToken.symbol,
      }),
    })
  }

  const totalWithdraw = getTotal({
    fees: withdrawGasFees,
    fromInput,
    fromToken,
  })

  const rejectedText = t('common.transaction-status.rejected')
  useEffect(
    function updateWithdrawalTransactionsAfterUserReject() {
      if (userWithdrawConfirmationStatus === 'error') {
        updateTransaction({
          id: 'withdraw',
          status: 'error',
          text: rejectedText,
        })
        return delayedClearTransactionList()
      }
      return undefined
    },
    [
      delayedClearTransactionList,
      rejectedText,
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
          text={t(
            `bridge-page.submit-button.${
              isWithdrawing ? 'withdrawing' : 'withdraw'
            }`,
          )}
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
