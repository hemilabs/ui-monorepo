import {
  ReviewWithdraw,
  WithdrawProgress,
} from 'components/reviewBox/reviewWithdraw'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Token } from 'types/token'
import { Button } from 'ui-common/components/button'
import { formatNumber } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { type Chain, formatUnits, Address } from 'viem'
import {
  UseWaitForTransactionReceiptReturnType,
  useAccount,
  useConfig,
} from 'wagmi'

import { useBridgeState } from '../_hooks/useBridgeState'
import { useWithdraw } from '../_hooks/useWithdraw'

import { BridgeForm, canSubmit } from './form'

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
  const [withdrawProgress, setWithdrawProgress] = useState<WithdrawProgress>(
    WithdrawProgress.IDLE,
  )
  // hold the withdrawTx to show after success
  const [successTxHash, setSuccessTxHash] = useState<Address | undefined>()

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

  useEffect(
    function handleWithdrawSuccess() {
      if (withdrawReceipt?.status === 'success') {
        const timeoutId = setTimeout(clearWithdrawState, 7000)
        if (!hasClearedForm) {
          setHasClearedForm(true)
          setSuccessTxHash(withdrawReceipt.transactionHash)
          setWithdrawProgress(WithdrawProgress.WITHDRAW_NOT_PUBLISHED)
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
      setSuccessTxHash,
      setWithdrawProgress,
      withdrawReceipt,
    ],
  )

  useEffect(
    function handleWithdrawErrors() {
      if (withdrawError || withdrawReceiptError) {
        const timeoutId = setTimeout(clearWithdrawState, 7000)
        if (!hasClearedForm) {
          setHasClearedForm(true)
          setWithdrawProgress(WithdrawProgress.IDLE)
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
      setWithdrawProgress,
      withdrawError,
      withdrawReceiptError,
    ],
  )

  const handleWithdraw = function () {
    setWithdrawn(fromInput)
    clearWithdrawState()
    withdraw()
    setHasClearedForm(false)
    setWithdrawProgress(WithdrawProgress.WITHDRAWING)
  }

  const isWithdrawing = withdrawProgress === WithdrawProgress.WITHDRAWING

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
          gas={formatUnits(withdrawGasFees, fromChain?.nativeCurrency.decimals)}
          gasSymbol={fromChain?.nativeCurrency.symbol}
          progress={withdrawProgress}
          toWithdraw={formatNumber(fromInput, 3)}
          withdrawSymbol={fromToken.symbol}
          withdrawTxHash={successTxHash}
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
