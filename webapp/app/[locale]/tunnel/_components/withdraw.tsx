import { MessageStatus } from '@eth-optimism/sdk'
import { Big } from 'big.js'
import { addTimestampToOperation } from 'context/tunnelHistoryContext/operations'
import { useAccounts } from 'hooks/useAccounts'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useWithdrawBitcoin } from 'hooks/useBtcTunnel'
import { useChain } from 'hooks/useChain'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { type RemoteChain } from 'types/chain'
import { Token } from 'types/token'
import { Button } from 'ui-common/components/button'
import { isEvmNetwork } from 'utils/chain'
import { formatBtcAddress, getFormattedValue } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { formatUnits, parseUnits } from 'viem'
import { useAccount } from 'wagmi'

import { useAfterTransaction } from '../_hooks/useAfterTransaction'
import { useTransactionsList } from '../_hooks/useTransactionsList'
import { useTunnelOperation } from '../_hooks/useTunnelOperation'
import {
  type EvmTunneling,
  type HemiToBitcoinTunneling,
  useTunnelState,
  type TypedTunnelState,
} from '../_hooks/useTunnelState'
import { useWithdraw } from '../_hooks/useWithdraw'
import { canSubmit, getTotal } from '../_utils'

import { ConnectEvmWallet } from './connectEvmWallet'
import { EvmSummary, FormContent, TunnelForm } from './form'
import { ReceivingAddress } from './receivingAddress'
import { SubmitWithTwoWallets } from './submitWithTwoWallets'

const MinBitcoinWithdraw = '0.005'

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

const WalletsConnected = dynamic(
  () => import('./walletsConnected').then(mod => mod.WalletsConnected),
  { ssr: false },
)

const WithdrawBtcGasUnits = BigInt(300_000)

const hasBridgeConfiguration = (token: Token, l1ChainId: RemoteChain['id']) =>
  isNativeToken(token) ||
  token.extensions?.bridgeInfo[l1ChainId].tokenAddress !== undefined

type BtcWithdrawProps = {
  state: TypedTunnelState<HemiToBitcoinTunneling>
}

const BtcWithdraw = function ({ state }: BtcWithdrawProps) {
  // use this to hold the withdrawn amount for the Tx list after clearing the state upon confirmation
  const [amountWithdrawn, setAmountWithdrawn] = useState('0')
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  const {
    fromInput,
    fromNetworkId,
    fromToken,
    resetStateAfterOperation,
    toNetworkId,
    updateFromInput,
  } = state

  const { btcAddress, evmChainId, evmWalletStatus } = useAccounts()
  const fromChain = useChain(fromNetworkId)
  const estimatedFees = useEstimateFees({
    chainId: fromNetworkId,
    enabled: evmWalletStatus === 'connected',
    gasUnits: WithdrawBtcGasUnits,
    overEstimation: 1.5,
  })
  const { balance: bitcoinBalance } = useTokenBalance(fromToken)
  const t = useTranslations()
  const { updateWithdrawal, withdrawals } = useTunnelHistory()
  const {
    clearWithdrawBitcoinState,
    withdrawBitcoin,
    withdrawBitcoinReceipt,
    withdrawBitcoinReceiptError,
    withdrawError,
    withdrawTxHash,
  } = useWithdrawBitcoin()

  const resetFormState = useCallback(
    function () {
      setIsWithdrawing(false)
      resetStateAfterOperation()
    },
    [setIsWithdrawing, resetStateAfterOperation],
  )

  const onSuccess = useCallback(
    function () {
      resetFormState()

      const withdrawalFound = withdrawals.find(
        w =>
          w.transactionHash === withdrawBitcoinReceipt.transactionHash &&
          !w.timestamp,
      )

      const extendedWithdrawal = {
        ...withdrawalFound,
        blockNumber: Number(withdrawBitcoinReceipt.blockNumber),
      }

      // Handling of this error is needed https://github.com/hemilabs/ui-monorepo/issues/322
      // eslint-disable-next-line promise/catch-or-return
      addTimestampToOperation(extendedWithdrawal, fromNetworkId).then(
        ({ timestamp }) =>
          updateWithdrawal(extendedWithdrawal, {
            status: MessageStatus.RELAYED,
            timestamp,
          }),
      )
    },
    [
      fromNetworkId,
      resetFormState,
      updateWithdrawal,
      withdrawals,
      withdrawBitcoinReceipt,
    ],
  )

  const { beforeTransaction } = useAfterTransaction({
    clearState: clearWithdrawBitcoinState,
    errorReceipts: [withdrawError, withdrawBitcoinReceiptError],
    onError: resetFormState,
    onSuccess,
    transactionReceipt: withdrawBitcoinReceipt,
  })

  const handleWithdraw = function () {
    beforeTransaction()
    setAmountWithdrawn(fromInput)
    clearWithdrawBitcoinState()
    withdrawBitcoin({
      amount: parseUnits(fromInput, fromToken.decimals),
      l1ChainId: toNetworkId,
      l2ChainId: fromNetworkId,
    })
    setIsWithdrawing(true)
  }

  // TODO we need to let the user know about the min value to withdraw
  // See https://github.com/hemilabs/ui-monorepo/issues/454
  const canWithdraw =
    canSubmit({
      balance: bitcoinBalance,
      chainId: evmChainId,
      fromInput,
      fromNetworkId,
      fromToken,
    }) && Big(fromInput).gte(MinBitcoinWithdraw)

  const gas = {
    amount: formatUnits(estimatedFees, fromChain?.nativeCurrency.decimals),
    label: t('common.network-gas-fee', { network: fromChain?.name }),
    symbol: fromChain?.nativeCurrency.symbol,
  }

  const transactionsList = useTransactionsList({
    inProgressMessage: t('tunnel-page.transaction-status.withdrawing', {
      fromInput: getFormattedValue(amountWithdrawn),
      network: fromChain?.name,
      symbol: fromToken.symbol,
    }),
    isOperating: isWithdrawing,
    operation: 'withdraw',
    receipt: withdrawBitcoinReceipt,
    receiptError: withdrawBitcoinReceiptError,
    successMessage: t('tunnel-page.transaction-status.withdrawn', {
      fromInput: getFormattedValue(amountWithdrawn),
      symbol: fromToken.symbol,
    }),
    txHash: withdrawTxHash,
    userConfirmationError: withdrawError,
  })

  return (
    <TunnelForm
      bottomSection={<WalletsConnected />}
      expectedChainId={state.fromNetworkId}
      explorerUrl={fromChain.blockExplorers.default.url}
      formContent={
        <FormContent
          isRunningOperation={isWithdrawing}
          setMaxBalanceButton={
            <SetMaxEvmBalance
              fromToken={fromToken}
              gas={estimatedFees}
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
            total={getTotal({
              fromInput,
              fromToken,
            })}
          />
        ) : null
      }
      submitButton={
        <>
          <div className="mb-2">
            <ReceivingAddress
              address={btcAddress ? formatBtcAddress(btcAddress) : undefined}
              receivingText={t('tunnel-page.form.bitcoin-receiving-address')}
              tooltipText={t(
                'tunnel-page.form.bitcoin-receiving-address-description',
                {
                  symbol: state.toToken.symbol,
                },
              )}
            />
          </div>
          <SubmitWithTwoWallets
            disabled={!canWithdraw || isWithdrawing}
            text={
              isWithdrawing
                ? t('tunnel-page.submit-button.withdrawing')
                : t('tunnel-page.submit-button.initiate-withdrawal')
            }
          />
        </>
      }
      transactionsList={transactionsList}
    />
  )
}

type EvmWithdrawProps = {
  state: TypedTunnelState<EvmTunneling>
}

const EvmWithdraw = function ({ state }: EvmWithdrawProps) {
  const { updateWithdrawal, withdrawals } = useTunnelHistory()
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

  const { chainId, isConnected } = useAccount()
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
    l2ChainId: fromNetworkId,
    toToken,
  })

  const resetFormState = useCallback(
    function () {
      setIsWithdrawing(false)
      resetStateAfterOperation()
    },
    [setIsWithdrawing, resetStateAfterOperation],
  )

  const onSuccess = useCallback(
    function () {
      resetFormState()
      const withdrawalFound = withdrawals.find(
        w =>
          w.transactionHash === withdrawReceipt.transactionHash && !w.timestamp,
      )
      const extendedWithdrawal = {
        ...withdrawalFound,
        blockNumber: Number(withdrawReceipt.blockNumber),
      }
      // Handling of this error is needed https://github.com/hemilabs/ui-monorepo/issues/322
      // eslint-disable-next-line promise/catch-or-return
      addTimestampToOperation(extendedWithdrawal, fromNetworkId).then(
        ({ timestamp }) =>
          updateWithdrawal(extendedWithdrawal, {
            status: MessageStatus.STATE_ROOT_NOT_PUBLISHED,
            timestamp,
          }),
      )
      // use this to show the TX confirmation in prove.tsx when mounting
      savePartialWithdrawal({
        withdrawalTxHash: withdrawReceipt.transactionHash,
      })
    },
    [
      fromNetworkId,
      resetFormState,
      savePartialWithdrawal,
      updateWithdrawal,
      withdrawals,
      withdrawReceipt,
    ],
  )

  const { beforeTransaction } = useAfterTransaction({
    clearState: clearWithdrawState,
    errorReceipts: [withdrawError, withdrawReceiptError],
    onError: resetFormState,
    onSuccess,
    transactionReceipt: withdrawReceipt,
  })

  const handleWithdraw = function () {
    beforeTransaction()
    clearWithdrawState()
    withdraw()
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
          isConnected ? (
            <Button disabled={!canWithdraw || isWithdrawing} type="submit">
              {t(
                `tunnel-page.submit-button.${
                  isWithdrawing ? 'withdrawing' : 'initiate-withdrawal'
                }`,
              )}
            </Button>
          ) : (
            <ConnectEvmWallet />
          )
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
