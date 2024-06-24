import { MessageDirection, MessageStatus } from '@eth-optimism/sdk'
import { RemoteChain, isEvmNetwork } from 'app/networks'
import { TunnelHistoryContext } from 'context/tunnelHistoryContext'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useChain } from 'hooks/useChain'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useContext, useEffect, useState } from 'react'
import { NativeTokenSpecialAddressOnL2 } from 'tokenList'
import { Token } from 'types/token'
import { Button } from 'ui-common/components/button'
import { getFormattedValue } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { formatUnits, parseUnits, zeroAddress } from 'viem'
import { useAccount } from 'wagmi'

import { useTransactionsList } from '../_hooks/useTransactionsList'
import { useTunnelOperation } from '../_hooks/useTunnelOperation'
import {
  type EvmTunneling,
  type HemiToBitcoinTunneling,
  useTunnelState,
  type TypedTunnelState,
} from '../_hooks/useTunnelState'
import { useWithdraw } from '../_hooks/useWithdraw'

import { FormContent, TunnelForm, canSubmit } from './form'

const ReviewWithdrawal = dynamic(
  () => import('./reviewWithdrawal').then(mod => mod.ReviewWithdrawal),
  {
    ssr: false,
  },
)

const hasBridgeConfiguration = (token: Token, l1ChainId: RemoteChain['id']) =>
  isNativeToken(token) ||
  token.extensions?.bridgeInfo[l1ChainId].tokenAddress !== undefined

type BtcWithdrawProps = {
  state: TypedTunnelState<HemiToBitcoinTunneling>
}

const BtcWithdraw = function ({ state }: BtcWithdrawProps) {
  const t = useTranslations()
  const isWithdrawing = false
  // eslint-disable-next-line arrow-body-style
  const handleWithdraw = () => {}
  return (
    <TunnelForm
      expectedChainId={state.fromNetworkId}
      formContent={
        <FormContent isRunningOperation={isWithdrawing} tunnelState={state} />
      }
      gas={{
        amount: '0',
        label: '',
        symbol: '',
      }}
      onSubmit={handleWithdraw}
      operationSymbol={state.fromToken.symbol}
      showReview={false}
      submitButton={
        <Button disabled type="submit">
          {t('tunnel-page.submit-button.initiate-withdrawal')}
        </Button>
      }
      total={state.fromInput}
      transactionsList={[]}
    />
  )
}

type EvmWithdrawProps = {
  state: TypedTunnelState<EvmTunneling>
}

const EvmWithdraw = function ({ state }: EvmWithdrawProps) {
  const { addWithdrawalToTunnelHistory, withdrawals } =
    useContext(TunnelHistoryContext)
  // use this to avoid infinite loops in effects when resetting the form
  const [hasClearedForm, setHasClearedForm] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  const t = useTranslations()

  const {
    fromInput,
    fromNetworkId,
    fromToken,
    resetStateAfterOperation,
    savePartialWithdrawal,
    toNetworkId,
    toToken,
  } = state

  const { chainId } = useAccount()
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
      if (
        withdrawReceipt?.status === 'success' &&
        !withdrawals.some(
          w => w.transactionHash === withdrawReceipt.transactionHash,
        )
      ) {
        const isNative = isNativeToken(fromToken)
        addWithdrawalToTunnelHistory({
          amount: parseUnits(fromInput, fromToken.decimals).toString(),
          blockNumber: Number(withdrawReceipt.blockNumber),
          data: '0x', // not needed
          direction: MessageDirection.L2_TO_L1,
          from: withdrawReceipt.from,
          l1Token: isNative ? zeroAddress : toToken.address,
          l2Token: isNative ? NativeTokenSpecialAddressOnL2 : fromToken.address,
          logIndex: 0, // not needed
          status: MessageStatus.STATE_ROOT_NOT_PUBLISHED,
          // "to" field uses the same address as from, which is user's address
          to: withdrawReceipt.from,
          transactionHash: withdrawReceipt.transactionHash,
        })
        // use this to show the TX confirmation in prove.tsx when mounting
        savePartialWithdrawal({
          withdrawalTxHash: withdrawReceipt.transactionHash,
        })
      }
    },
    [
      addWithdrawalToTunnelHistory,
      fromInput,
      fromToken,
      savePartialWithdrawal,
      toNetworkId,
      toToken,
      withdrawals,
      withdrawReceipt,
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
      fromInput: getFormattedValue(fromInput),
      network: fromChain?.name,
      symbol: fromToken.symbol,
    }),
    isOperating: isWithdrawing,
    operation: 'withdraw',
    receipt: withdrawReceipt,
    receiptError: withdrawReceiptError,
    successMessage: t('tunnel-page.transaction-status.withdrawn', {
      fromInput: getFormattedValue(fromInput),
      symbol: fromToken.symbol,
    }),
    // @ts-expect-error string is `0x${string}`
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
        formContent={
          <FormContent isRunningOperation={isWithdrawing} tunnelState={state} />
        }
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
        />
      )}
    </>
  )
}

export const Withdraw = function ({
  state,
}: {
  state: ReturnType<typeof useTunnelState>
}) {
  const { toNetworkId } = state
  const toChain = useChain(toNetworkId)

  // Typescript can't infer it, but we can cast these safely
  if (isEvmNetwork(toChain)) {
    return <EvmWithdraw state={state as TypedTunnelState<EvmTunneling>} />
  }
  return (
    <BtcWithdraw state={state as TypedTunnelState<HemiToBitcoinTunneling>} />
  )
}
