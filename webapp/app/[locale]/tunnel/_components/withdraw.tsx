import { MessageDirection, MessageStatus, toBigNumber } from '@eth-optimism/sdk'
import { TunnelHistoryContext } from 'context/tunnelHistoryContext'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useChain } from 'hooks/useChain'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useContext, useEffect, useState } from 'react'
import { NativeTokenSpecialAddressOnL2 } from 'tokenList'
import { Token } from 'types/token'
import { Button } from 'ui-common/components/button'
import { isNativeToken } from 'utils/token'
import { type Chain, formatUnits, parseUnits, zeroAddress } from 'viem'
import { useAccount } from 'wagmi'

import { useTransactionsList } from '../_hooks/useTransactionsList'
import { useTunnelOperation, useTunnelState } from '../_hooks/useTunnelState'
import { useWithdraw } from '../_hooks/useWithdraw'

import { TunnelForm, canSubmit } from './form'

const ReviewWithdrawal = dynamic(
  () => import('./reviewWithdrawal').then(mod => mod.ReviewWithdrawal),
  {
    ssr: false,
  },
)

const hasBridgeConfiguration = (token: Token, l1ChainId: Chain['id']) =>
  isNativeToken(token) ||
  token.extensions?.bridgeInfo[l1ChainId].tokenAddress !== undefined

type Props = {
  renderForm: (isRunningOperation: boolean) => React.ReactNode
  state: ReturnType<typeof useTunnelState>
}

export const Withdraw = function ({ renderForm, state }: Props) {
  const { addWithdrawalToTunnelHistory } = useContext(TunnelHistoryContext)
  // use this to avoid infinite loops in effects when resetting the form
  const [hasClearedForm, setHasClearedForm] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  const t = useTranslations()

  const {
    fromInput,
    fromNetworkId,
    fromToken,
    partialWithdrawal,
    resetStateAfterOperation,
    savePartialWithdrawal,
    toNetworkId,
    toToken,
  } = state

  const { address, chainId } = useAccount()
  const { txHash } = useTunnelOperation()

  const operatesNativeToken = isNativeToken(fromToken)

  const fromChain = useChain(fromNetworkId)

  const { balance: walletNativeTokenBalance } = useNativeTokenBalance(
    fromToken.chainId,
  )

  const { balance: walletTokenBalance } = useTokenBalance(
    fromToken,
    !operatesNativeToken,
  )

  const canWithdraw =
    canSubmit({
      chainId,
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
  } = useWithdraw({
    canWithdraw,
    fromInput,
    fromToken,
    l1ChainId: toNetworkId,
    toToken,
  })

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

  useEffect(
    function handleWithdrawalSuccess() {
      if (withdrawReceipt?.status === 'success') {
        const isNative = isNativeToken(fromToken)
        addWithdrawalToTunnelHistory({
          amount: parseUnits(fromInput, fromToken.decimals).toString(),
          blockNumber: Number(withdrawReceipt.blockNumber),
          data: '0x', // not needed
          direction: MessageDirection.L2_TO_L1,
          from: withdrawReceipt.from,
          l1Token: isNative ? zeroAddress : fromToken.address,
          l2Token: isNative ? NativeTokenSpecialAddressOnL2 : toToken.address,
          logIndex: 0, // not needed
          // "to" field uses the same address as from, which is user's address
          to: withdrawReceipt.from,
          transactionHash: withdrawReceipt.transactionHash,
        })
      }
    },
    [
      addWithdrawalToTunnelHistory,
      fromInput,
      fromToken,
      toToken,
      withdrawReceipt,
    ],
  )

  // this is needed to be able to show the transaction amount when switching to
  // prove.tsx component. This is because it takes a while for the op-sdk to show the withdrawal
  // in the "GetWithdrawals" method after confirming the tx, and if we don't do this,
  // it would show a spinner of the data user wrote on the form.
  // Updating react-query's cache is not enough because it will be overridden
  // by a few refetch requests until the API returns the withdrawal.
  // When starting from scratch (refresh) we are loading everything so there
  // it is ok to show a Loading skeleton.
  useEffect(
    function saveWithdrawDataForProve() {
      if (!partialWithdrawal && txHash) {
        savePartialWithdrawal({
          amount: toBigNumber(
            parseUnits(fromInput, fromToken.decimals).toString(),
          ),
          direction: MessageDirection.L2_TO_L1,
          from: address,
          l1Token: zeroAddress,
          l2Token: isNativeToken(fromToken)
            ? NativeTokenSpecialAddressOnL2
            : fromToken.extensions.bridgeInfo[toNetworkId].tokenAddress,
          transactionHash: txHash,
        })
      }
    },
    [
      address,
      fromInput,
      fromToken,
      partialWithdrawal,
      savePartialWithdrawal,
      toNetworkId,
      txHash,
    ],
  )

  const handleWithdraw = function () {
    clearWithdrawState()
    withdraw()
    setHasClearedForm(false)
    setIsWithdrawing(true)
  }

  const transactionsList = useTransactionsList({
    expectedWithdrawSuccessfulMessageStatus:
      MessageStatus.STATE_ROOT_NOT_PUBLISHED,
    inProgressMessage: t('tunnel-page.transaction-status.withdrawing', {
      fromInput,
      network: fromChain?.name,
      symbol: fromToken.symbol,
    }),
    isOperating: isWithdrawing,
    l1ChainId: toNetworkId,
    operation: 'withdraw',
    receipt: withdrawReceipt,
    receiptError: withdrawReceiptError,
    successMessage: t('tunnel-page.transaction-status.withdrawn', {
      fromInput,
      symbol: fromToken.symbol,
    }),
    txHash,
    userConfirmationError: withdrawError,
  })

  const gas = {
    amount: formatUnits(withdrawGasFees, fromChain?.nativeCurrency.decimals),
    label: t('common.network-gas-fee', { network: fromChain?.name }),
    symbol: fromChain?.nativeCurrency.symbol,
  }

  return (
    <>
      <TunnelForm
        expectedChainId={fromNetworkId}
        formContent={renderForm(isWithdrawing)}
        gas={gas}
        onSubmit={handleWithdraw}
        operationSymbol={fromToken.symbol}
        showReview={canWithdraw}
        submitButton={
          <Button disabled={!canWithdraw || isWithdrawing} type="submit">
            {t(
              `tunnel-page.submit-button.${
                isWithdrawing ? 'withdrawing' : 'initiate-withdrawal'
              }`,
            )}
          </Button>
        }
        total={fromInput}
        transactionsList={transactionsList}
      />
      {!!txHash && (
        <ReviewWithdrawal
          gas={gas}
          isRunningOperation={isWithdrawing}
          onClose={resetStateAfterOperation}
          transactionsList={transactionsList}
          withdrawal={partialWithdrawal}
        />
      )}
    </>
  )
}
