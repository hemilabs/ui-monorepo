import { MessageStatus } from '@eth-optimism/sdk'
import { RemoteChain, bitcoin, isEvmNetwork } from 'app/networks'
import { TunnelHistoryContext } from 'context/tunnelHistoryContext'
import { addTimestampToOperation } from 'context/tunnelHistoryContext/operations'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useChain } from 'hooks/useChain'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useContext, useEffect, useState } from 'react'
import { Token } from 'types/token'
import { Button } from 'ui-common/components/button'
import { getFormattedValue } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { formatUnits } from 'viem'
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

import { EvmSummary, FormContent, TunnelForm, canSubmit } from './form'

const ReviewEvmWithdrawal = dynamic(
  () =>
    import('./reviewOperation/reviewEvmWithdrawal').then(
      mod => mod.ReviewEvmWithdrawal,
    ),
  {
    ssr: false,
  },
)

const SetMaxEvmBalance = dynamic(
  () => import('./setMaxBalance').then(mod => mod.SetMaxEvmBalance),
  { ssr: false },
)

const hasBridgeConfiguration = (token: Token, l1ChainId: RemoteChain['id']) =>
  isNativeToken(token) ||
  token.extensions?.bridgeInfo[l1ChainId].tokenAddress !== undefined

type BtcWithdrawProps = {
  state: TypedTunnelState<HemiToBitcoinTunneling>
}

// TODO implement correctly, this only puts some props so it compiles
// but nothing is actually visible until BTC is enabled
// https://github.com/BVM-priv/ui-monorepo/issues/343
const BtcWithdraw = function ({ state }: BtcWithdrawProps) {
  const { fromToken, updateFromInput } = state
  const t = useTranslations()
  const isWithdrawing = false
  // eslint-disable-next-line arrow-body-style
  const handleWithdraw = () => {}
  return (
    <TunnelForm
      expectedChainId={state.fromNetworkId}
      explorerUrl={bitcoin.blockExplorers.default.url}
      formContent={
        <FormContent
          isRunningOperation={isWithdrawing}
          setMaxBalanceButton={
            <SetMaxEvmBalance
              fromToken={fromToken}
              // Fees will be defined once btc withdraw is implemented
              gas={BigInt(0)}
              isRunningOperation={isWithdrawing}
              onSetMaxBalance={maxBalance => updateFromInput(maxBalance)}
            />
          }
          tunnelState={state}
        />
      }
      onSubmit={handleWithdraw}
      submitButton={
        <Button disabled type="submit">
          {t('tunnel-page.submit-button.initiate-withdrawal')}
        </Button>
      }
      transactionsList={[]}
    />
  )
}

type EvmWithdrawProps = {
  state: TypedTunnelState<EvmTunneling>
}

const EvmWithdraw = function ({ state }: EvmWithdrawProps) {
  const { updateWithdrawal, withdrawals } = useContext(TunnelHistoryContext)
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
    updateFromInput,
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
      balance: operatesNativeToken
        ? walletNativeTokenBalance
        : walletTokenBalance,
      chainId,
      fromInput,
      fromNetworkId,
      fromToken,
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
      if (withdrawReceipt?.status !== 'success') {
        return
      }
      const withdrawalFound = withdrawals.find(
        w =>
          w.transactionHash === withdrawReceipt.transactionHash && !w.timestamp,
      )
      if (withdrawalFound) {
        const extendedWithdrawal = {
          ...withdrawalFound,
          blockNumber: Number(withdrawReceipt.blockNumber),
        }
        // Handling of this error is needed https://github.com/BVM-priv/ui-monorepo/issues/322
        // eslint-disable-next-line promise/catch-or-return
        addTimestampToOperation(extendedWithdrawal, fromNetworkId).then(w =>
          updateWithdrawal(extendedWithdrawal, {
            ...w,
            status: MessageStatus.STATE_ROOT_NOT_PUBLISHED,
          }),
        )
        // use this to show the TX confirmation in prove.tsx when mounting
        savePartialWithdrawal({
          withdrawalTxHash: withdrawReceipt.transactionHash,
        })
      }
    },
    [
      fromNetworkId,
      savePartialWithdrawal,
      updateWithdrawal,
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
        explorerUrl={fromChain?.blockExplorers.default.url}
        formContent={
          <FormContent
            isRunningOperation={isWithdrawing}
            setMaxBalanceButton={
              <SetMaxEvmBalance
                fromToken={fromToken}
                gas={withdrawGasFees}
                isRunningOperation={isWithdrawing}
                onSetMaxBalance={maxBalance => updateFromInput(maxBalance)}
              />
            }
            tunnelState={state}
          />
        }
        onSubmit={handleWithdraw}
        reviewSummary={
          canWithdraw ? (
            <EvmSummary
              gas={gas}
              operationSymbol={fromToken.symbol}
              total={fromInput}
            />
          ) : null
        }
        submitButton={
          <Button disabled={!canWithdraw || isWithdrawing} type="submit">
            {t(
              `tunnel-page.submit-button.${
                isWithdrawing ? 'withdrawing' : 'initiate-withdrawal'
              }`,
            )}
          </Button>
        }
        transactionsList={transactionsList}
      />
      {!!txHash && (
        <ReviewEvmWithdrawal
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
