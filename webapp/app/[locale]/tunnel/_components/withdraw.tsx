import { ReviewWithdraw } from 'components/reviewBox'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Token } from 'types/token'
import { Button } from 'ui-common/components/button'
import { formatNumber } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { type Chain, formatUnits } from 'viem'
import {
  UseWaitForTransactionReceiptReturnType,
  useAccount,
  useConfig,
} from 'wagmi'

import { useBridgeState } from '../_hooks/useBridgeState'
import { useWithdraw } from '../_hooks/useWithdraw'

import { BridgeForm, canSubmit, getTotal } from './form'

const TransactionStatus = dynamic(
  () =>
    import('components/transactionStatus').then(mod => mod.TransactionStatus),
  {
    ssr: false,
  },
)
type UseUiTransactionsList = {
  fromChain: Chain | undefined
  fromToken: Token
  isWithdrawing: boolean
  withdrawn: string
  withdrawError: Error | undefined
  withdrawReceipt: UseWaitForTransactionReceiptReturnType['data'] | undefined
  withdrawReceiptError: Error | undefined
  withdrawTxHash: string | undefined
}
const useTransactionList = function ({
  fromChain,
  fromToken,
  isWithdrawing,
  withdrawError,
  withdrawn,
  withdrawReceipt,
  withdrawReceiptError,
  withdrawTxHash,
}: UseUiTransactionsList) {
  const t = useTranslations()
  const transactionsList = []

  if (withdrawError) {
    // user rejected the request
    if (
      ['user rejected', 'denied transaction signature'].includes(
        withdrawError.message,
      )
    ) {
      transactionsList.push({
        id: 'withdraw',
        status: 'error',
        text: t('common.transaction-status.rejected'),
      })
    } else {
      // failed for some reason before sending the tx to the node (no tx hash)
      transactionsList.push({
        id: 'withdraw',
        status: 'error',
        text: t('common.transaction-status.error'),
      })
    }
  }

  if (withdrawTxHash || (isWithdrawing && !withdrawError)) {
    // withdraw failed for some reason
    if (withdrawReceiptError) {
      transactionsList.push({
        id: 'withdraw',
        status: 'error',
        text: t('common.transaction-status.error'),
      })
    }
    // withdraw was successful
    if (withdrawReceipt?.status === 'success') {
      transactionsList.push({
        id: 'withdraw',
        status: 'success',
        text: t('bridge-page.transaction-status.withdrawn', {
          fromInput: withdrawn,
          symbol: fromToken.symbol,
        }),
      })
    }
    // withdrawal in progress
    if (!withdrawReceipt) {
      transactionsList.push({
        id: 'withdraw',
        status: 'loading',
        text: t('bridge-page.transaction-status.withdrawing', {
          fromInput: withdrawn,
          network: fromChain?.name,
          symbol: fromToken.symbol,
        }),
        txHash: withdrawTxHash,
      })
    }
  }

  return transactionsList
}

const hasBridgeConfiguration = (token: Token, l1ChainId: Chain['id']) =>
  isNativeToken(token) ||
  token.extensions?.bridgeInfo[l1ChainId].tokenAddress !== undefined

type Props = {
  renderForm: (isRunningOperation: boolean) => React.ReactNode
  state: ReturnType<typeof useBridgeState>
}

export const Withdraw = function ({ renderForm, state }: Props) {
  // use this to hold the withdrawn amount for the Tx list after clearing the state upon confirmation
  const [withdrawn, setWithdrawn] = useState('0')
  // use this to avoid infinite loops in effects when resetting the form
  const [hasClearedForm, setHasClearedForm] = useState(false)
  // use this to be able to show state boxes before user confirmation (mutation isn't finished)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  const t = useTranslations()

  const {
    fromInput,
    fromNetworkId,
    fromToken,
    resetStateAfterOperation,
    toNetworkId,
    toToken,
  } = state

  const { chains = [] } = useConfig()
  const { chain } = useAccount()

  const operatesNativeToken = isNativeToken(fromToken)

  const fromChain = chains.find(c => c.id === fromNetworkId)

  const { balance: walletNativeTokenBalance } = useNativeTokenBalance(
    fromToken.chainId,
  )

  const { balance: walletTokenBalance } = useTokenBalance(
    fromToken,
    !operatesNativeToken,
  )

  const canWithdraw =
    canSubmit({
      chainId: chain?.id,
      fromInput,
      fromNetworkId,
      fromToken,
      walletNativeTokenBalance,
      walletTokenBalance,
    }) && hasBridgeConfiguration(fromToken, toNetworkId)

  const {
    clearWithdrawState,
    withdraw,
    withdrawError,
    withdrawGasFees,
    withdrawReceipt,
    withdrawReceiptError,
    withdrawTxHash,
  } = useWithdraw({
    canWithdraw,
    fromInput,
    fromToken,
    l1ChainId: toNetworkId,
    toToken,
  })

  const withdrawReceiptStatus = withdrawReceipt?.status
  useEffect(
    function handleWithdrawSuccess() {
      if (withdrawReceiptStatus === 'success') {
        const timeoutId = setTimeout(clearWithdrawState, 7000)
        if (!hasClearedForm) {
          setHasClearedForm(true)
          setIsWithdrawing(false)
          resetStateAfterOperation()
        }
        return () => clearTimeout(timeoutId)
      }
      return undefined
    },
    [
      clearWithdrawState,
      hasClearedForm,
      resetStateAfterOperation,
      setHasClearedForm,
      setIsWithdrawing,
      withdrawReceiptStatus,
    ],
  )

  useEffect(
    function handleWithdrawErrors() {
      if (withdrawError || withdrawReceiptError) {
        const timeoutId = setTimeout(clearWithdrawState, 7000)
        if (!hasClearedForm) {
          setHasClearedForm(true)
          setIsWithdrawing(false)
          resetStateAfterOperation()
        }
        return () => clearTimeout(timeoutId)
      }
      return undefined
    },
    [
      clearWithdrawState,
      hasClearedForm,
      resetStateAfterOperation,
      setHasClearedForm,
      setIsWithdrawing,
      withdrawError,
      withdrawReceiptError,
    ],
  )

  const handleWithdraw = function () {
    setWithdrawn(fromInput)
    clearWithdrawState()
    withdraw()
    setHasClearedForm(false)
    setIsWithdrawing(true)
  }

  const totalWithdraw = getTotal({
    fees: withdrawGasFees,
    fromInput,
    fromToken,
  })

  const transactionsList = useTransactionList({
    fromChain,
    fromToken,
    isWithdrawing,
    withdrawError,
    withdrawn,
    withdrawReceipt,
    withdrawReceiptError,
    withdrawTxHash,
  })

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
        <Button disabled={!canWithdraw || isWithdrawing} type="submit">
          {t(
            `bridge-page.submit-button.${
              isWithdrawing ? 'withdrawing' : 'withdraw'
            }`,
          )}
        </Button>
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
