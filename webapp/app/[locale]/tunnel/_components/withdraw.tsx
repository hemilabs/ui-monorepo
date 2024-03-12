import {
  ReviewWithdraw,
  WithdrawProgress,
} from 'components/reviewBox/reviewWithdraw'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Token } from 'types/token'
import { Button } from 'ui-common/components/button'
import { formatNumber } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { type Chain, formatUnits, Hash } from 'viem'
import { useAccount, useConfig } from 'wagmi'

import { useBridgeState } from '../_hooks/useBridgeState'
import { useWithdraw } from '../_hooks/useWithdraw'

import { BridgeForm, canSubmit } from './form'

type UseUiTransactionsList = {
  fromChain: Chain | undefined
  fromToken: Token
  isWithdrawing: boolean
  withdrawn: string
  withdrawError: Error | undefined
  withdrawReceiptError: Error | undefined
  withdrawTxHash: Hash | undefined
}
const useTransactionList = function ({
  fromChain,
  fromToken,
  isWithdrawing,
  withdrawError,
  withdrawn,
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
        txHash: withdrawTxHash,
      })
    } else {
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
    // success status is shown in the Prove page!
  }

  return transactionsList
}

const hasBridgeConfiguration = (token: Token, l1ChainId: Chain['id']) =>
  isNativeToken(token) ||
  token.extensions?.bridgeInfo[l1ChainId].tokenAddress !== undefined

type Props = {
  renderForm: (isRunningOperation: boolean) => React.ReactNode
  state: ReturnType<typeof useBridgeState> & { operation: 'withdraw' }
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

  const t = useTranslations()

  const {
    fromInput,
    fromNetworkId,
    fromToken,
    resetStateAfterOperation,
    toNetworkId,
    toToken,
    waitForWithdrawalPublished,
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
    function goToWaitToLaterProveForm() {
      if (withdrawReceipt?.status === 'success') {
        clearWithdrawState()
        waitForWithdrawalPublished({
          withdrawAmount: fromInput,
          withdrawL1NetworkId: toNetworkId,
          withdrawSymbol: fromToken.symbol,
          withdrawTxHash: withdrawReceipt.transactionHash,
        })
        resetStateAfterOperation()
      }
      return undefined
    },
    [
      clearWithdrawState,
      fromInput,
      fromToken,
      resetStateAfterOperation,
      toNetworkId,
      waitForWithdrawalPublished,
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
          operation="withdraw"
          progress={withdrawProgress}
          toWithdraw={formatNumber(fromInput, 3)}
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
      transactionsList={transactionsList}
    />
  )
}
