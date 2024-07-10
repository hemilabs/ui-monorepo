'use client'

import { MessageDirection } from '@eth-optimism/sdk'
import { bitcoin, isEvmNetwork } from 'app/networks'
import { useBalance as useBtcBalance } from 'btc-wallet/hooks/useBalance'
import { TunnelHistoryContext } from 'context/tunnelHistoryContext'
import { addTimestampToOperation } from 'context/tunnelHistoryContext/operations'
import {
  BtcDepositStatus,
  EvmDepositOperation,
} from 'context/tunnelHistoryContext/types'
import { useAccounts } from 'hooks/useAccounts'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useDepositBitcoin } from 'hooks/useBtcTunnel'
import { useChain } from 'hooks/useChain'
import { useGetFeePrices } from 'hooks/useEstimateBtcFees'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useContext, useEffect, useState } from 'react'
import { NativeTokenSpecialAddressOnL2 } from 'tokenList'
import { type EvmToken, type Token } from 'types/token'
import { Button } from 'ui-common/components/button'
import { formatNumber, getFormattedValue } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { watchAsset } from 'utils/watchAsset'
import { formatUnits, parseUnits, zeroAddress } from 'viem'
import { useAccount as useEvmAccount, useWalletClient } from 'wagmi'

import { useBtcDeposits } from '../_hooks/useBtcDeposits'
import { useDeposit } from '../_hooks/useDeposit'
import { useTransactionsList } from '../_hooks/useTransactionsList'
import { useTunnelOperation } from '../_hooks/useTunnelOperation'
import {
  type BtcToHemiTunneling,
  type EvmTunneling,
  useTunnelState,
  TypedTunnelState,
} from '../_hooks/useTunnelState'

import { Erc20Approval } from './Erc20Approval'
import {
  BtcFees,
  EvmSummary,
  FormContent,
  TunnelForm,
  canSubmit,
  getTotal,
} from './form'
import { ReceivingHemiAddress } from './receivingHemiAddress'

type OperationRunning = 'idle' | 'approving' | 'depositing'

const ReviewBtcDeposit = dynamic(
  () =>
    import('./reviewOperation/reviewBtcDeposit').then(
      mod => mod.ReviewBtcDeposit,
    ),
  {
    ssr: false,
  },
)

const SetMaxBtcBalance = dynamic(
  () => import('./setMaxBalance').then(mod => mod.SetMaxBtcBalance),
  { ssr: false },
)

const SetMaxEvmBalance = dynamic(
  () => import('./setMaxBalance').then(mod => mod.SetMaxEvmBalance),
  { ssr: false },
)

const WalletsConnected = dynamic(
  () => import('./walletsConnected').then(mod => mod.WalletsConnected),
  { ssr: false },
)

const SubmitButton = function ({
  canDeposit,
  extendedErc20Approval,
  fromToken,
  isRunningOperation,
  needsApproval,
  operationRunning,
  updateExtendedErc20Approval,
}: {
  canDeposit: boolean
  extendedErc20Approval: boolean
  fromToken: Token
  isRunningOperation: boolean
  needsApproval: boolean
  operationRunning: OperationRunning
  updateExtendedErc20Approval: () => void
}) {
  const t = useTranslations()

  const getOperationButtonText = function () {
    const texts = {
      approve: {
        idle: t('tunnel-page.submit-button.approve-and-deposit'),
        loading: t('tunnel-page.submit-button.approving'),
      },
      deposit: {
        idle: t('tunnel-page.submit-button.deposit'),
        loading: t('tunnel-page.submit-button.depositing'),
      },
    }
    if (!isRunningOperation) {
      return texts[needsApproval ? 'approve' : 'deposit'].idle
    }
    if (operationRunning === 'approving') {
      return texts.approve.loading
    }
    if (operationRunning === 'depositing') {
      return texts.deposit.loading
    }
    return texts.deposit.idle
  }

  return (
    <>
      <Erc20Approval
        checked={extendedErc20Approval}
        disabled={
          isNativeToken(fromToken) || !needsApproval || isRunningOperation
        }
        onCheckedChange={updateExtendedErc20Approval}
      />
      <Button disabled={!canDeposit || isRunningOperation} type="submit">
        {getOperationButtonText()}
      </Button>
    </>
  )
}

type BtcDepositProps = {
  state: TypedTunnelState<BtcToHemiTunneling>
}

const BtcDeposit = function ({ state }: BtcDepositProps) {
  const deposits = useBtcDeposits()
  const { updateBtcDeposit } = useContext(TunnelHistoryContext)
  // use this to avoid infinite loops in effects when resetting the form
  const [hasClearedForm, setHasClearedForm] = useState(false)
  // use this to hold the deposited amount for the Tx list after clearing the state upon confirmation
  const [depositAmount, setDepositAmount] = useState('0')
  const [isDepositing, setIsDepositing] = useState(false)

  const {
    fromInput,
    fromNetworkId,
    fromToken,
    resetStateAfterOperation,
    updateFromInput,
    toToken,
  } = state

  const { btcChainId, evmAddress } = useAccounts()
  const { balance } = useBtcBalance()
  const { txHash } = useTunnelOperation()

  const canDeposit = canSubmit({
    balance: BigInt(balance?.confirmed ?? 0),
    chainId: btcChainId,
    fromInput,
    fromNetworkId,
    fromToken,
  })

  const {
    clearDepositState,
    depositBitcoin,
    depositError,
    depositReceipt,
    depositReceiptError,
    depositTxId,
  } = useDepositBitcoin()

  const t = useTranslations()

  useEffect(
    function handleDepositErrors() {
      if (depositError || depositReceiptError) {
        const timeoutId = setTimeout(clearDepositState, 7000)
        if (!hasClearedForm) {
          setHasClearedForm(true)
          setIsDepositing(false)
          resetStateAfterOperation()
        }
        return () => clearTimeout(timeoutId)
      }
      return undefined
    },
    [
      clearDepositState,
      depositError,
      depositReceiptError,
      hasClearedForm,
      resetStateAfterOperation,
      setHasClearedForm,
      setIsDepositing,
    ],
  )

  const { data: walletClient } = useWalletClient({ chainId: toToken.chainId })

  useEffect(
    function handleDepositSuccess() {
      if (!depositReceipt?.status.confirmed) {
        return undefined
      }

      watchAsset(walletClient, toToken).catch(function (err) {
        // eslint-disable-next-line no-console
        console.warn(
          `Could not add ${toToken.symbol} to the wallet: ${err.message}`,
        )
      })

      const deposit = deposits.find(
        d =>
          d.transactionHash === depositReceipt.txId &&
          d.status === BtcDepositStatus.TX_PENDING,
      )
      if (!hasClearedForm) {
        setHasClearedForm(true)
        setIsDepositing(false)
        resetStateAfterOperation()
        updateBtcDeposit(deposit, {
          blockNumber: depositReceipt.status.blockHeight,
          status: BtcDepositStatus.TX_CONFIRMED,
          timestamp: depositReceipt.status.blockTime,
        })
      }

      const timeoutId = setTimeout(clearDepositState, 7000)
      return () => clearTimeout(timeoutId)
    },
    [
      clearDepositState,
      depositReceipt,
      deposits,
      hasClearedForm,
      resetStateAfterOperation,
      setHasClearedForm,
      setIsDepositing,
      toToken,
      updateBtcDeposit,
      walletClient,
    ],
  )

  const transactionsList = useTransactionsList({
    inProgressMessage: t('tunnel-page.transaction-status.depositing', {
      fromInput: getFormattedValue(depositAmount),
      symbol: fromToken.symbol,
    }),
    isOperating: isDepositing,
    operation: 'deposit',
    receipt: depositReceipt,
    receiptError: depositReceiptError,
    successMessage: t('tunnel-page.transaction-status.deposited', {
      fromInput: getFormattedValue(depositAmount),
      symbol: fromToken.symbol,
    }),
    txHash: depositTxId,
    userConfirmationError: depositError,
  })
  const { feePrices } = useGetFeePrices()

  const handleDeposit = function () {
    if (!canDeposit) {
      return
    }
    setDepositAmount(fromInput)
    setIsDepositing(true)
    const satoshis = Number(parseUnits(fromInput, fromToken.decimals))
    depositBitcoin(satoshis, evmAddress)
  }

  const fees = feePrices?.fastestFee?.toString()

  return (
    <>
      <TunnelForm
        bottomSection={<WalletsConnected />}
        expectedChainId={bitcoin.id}
        explorerUrl={bitcoin.blockExplorers.default.url}
        formContent={
          <FormContent
            isRunningOperation={isDepositing}
            setMaxBalanceButton={
              <SetMaxBtcBalance
                fromToken={fromToken}
                isRunningOperation={isDepositing}
                onSetMaxBalance={maxBalance => updateFromInput(maxBalance)}
              />
            }
            tunnelState={state}
          />
        }
        onSubmit={handleDeposit}
        reviewSummary={fees !== undefined ? <BtcFees fees={fees} /> : null}
        submitButton={
          <>
            <div className="mb-2">
              <ReceivingHemiAddress token={state.fromToken} />
            </div>
            <Button disabled={!canDeposit} type="submit">
              {t('tunnel-page.submit-button.deposit')}
            </Button>
          </>
        }
        transactionsList={transactionsList}
      />
      {!!txHash && (
        <ReviewBtcDeposit
          fees={
            fees !== undefined
              ? {
                  amount: fees,
                  symbol: 'sat/vB',
                }
              : undefined
          }
          isRunningOperation={isDepositing}
          onClose={resetStateAfterOperation}
          token={fromToken}
          transactionsList={transactionsList}
        />
      )}
    </>
  )
}

type EvmDepositProps = {
  state: TypedTunnelState<EvmTunneling>
}

const EvmDeposit = function ({ state }: EvmDepositProps) {
  const { addEvmDepositToTunnelHistory } = useContext(TunnelHistoryContext)
  // use this to hold the deposited amount for the Tx list after clearing the state upon confirmation
  const [depositAmount, setDepositAmount] = useState('0')
  // use this to avoid infinite loops in effects when resetting the form
  const [hasClearedForm, setHasClearedForm] = useState(false)
  // use this to be able to show state boxes before user confirmation (mutation isn't finished)
  const [operationRunning, setOperationRunning] =
    useState<OperationRunning>('idle')

  // use this state to toggle the Erc20 token approval
  const [extendedErc20Approval, setExtendedErc20Approval] = useState(false)

  const t = useTranslations()

  const {
    fromInput,
    fromNetworkId,
    fromToken,
    resetStateAfterOperation,
    toToken,
    updateFromInput,
  } = state

  const { chain } = useEvmAccount()

  const operatesNativeToken = isNativeToken(fromToken)

  const { balance: walletNativeTokenBalance } = useNativeTokenBalance(
    fromToken.chainId,
  )

  const { balance: walletTokenBalance } = useTokenBalance(
    fromToken,
    !operatesNativeToken,
  )

  const canDeposit = canSubmit({
    balance: operatesNativeToken
      ? walletNativeTokenBalance
      : walletTokenBalance,
    chainId: chain?.id,
    fromInput,
    fromNetworkId,
    fromToken,
  })

  const fromChain = useChain(fromNetworkId)

  const {
    approvalError,
    approvalReceipt,
    approvalReceiptError,
    approvalTxHash,
    approvalTokenGasFees = BigInt(0),
    clearDepositState,
    needsApproval,
    deposit,
    depositError,
    depositGasFees,
    depositReceipt,
    depositReceiptError,
    depositTxHash,
  } = useDeposit({
    canDeposit,
    extendedErc20Approval: operatesNativeToken
      ? undefined
      : extendedErc20Approval,
    fromInput,
    fromToken,
    toToken,
  })

  const approvalReceiptStatus = approvalReceipt?.status
  useEffect(
    function handleApprovalSuccess() {
      if (
        approvalReceiptStatus === 'success' &&
        operationRunning === 'approving'
      ) {
        setOperationRunning('depositing')
      }
    },
    [approvalReceiptStatus, operationRunning, setOperationRunning],
  )

  const { data: walletClient } = useWalletClient()

  useEffect(
    function handleDepositSuccess() {
      if (depositReceipt?.status !== 'success') {
        return undefined
      }

      watchAsset(walletClient, toToken).catch(function (err) {
        // eslint-disable-next-line no-console
        console.warn(
          `Could not add ${toToken.symbol} to the wallet: ${err.message}`,
        )
      })

      if (!hasClearedForm) {
        setHasClearedForm(true)
        setOperationRunning('idle')
        resetStateAfterOperation()
        const isNative = isNativeToken(fromToken)
        // Handling of this error is needed https://github.com/BVM-priv/ui-monorepo/issues/322
        // eslint-disable-next-line promise/catch-or-return
        addTimestampToOperation<EvmDepositOperation>(
          {
            amount: parseUnits(fromInput, fromToken.decimals).toString(),
            blockNumber: Number(depositReceipt.blockNumber),
            chainId: fromNetworkId,
            direction: MessageDirection.L1_TO_L2,
            from: depositReceipt.from,
            l1Token: isNative ? zeroAddress : fromToken.address,
            l2Token: isNative ? NativeTokenSpecialAddressOnL2 : toToken.address,
            // "to" field uses the same address as from, which is user's address
            to: depositReceipt.from,
            transactionHash: depositReceipt.transactionHash,
          },
          fromToken.chainId,
        ).then(addEvmDepositToTunnelHistory)
      }

      const timeoutId = setTimeout(clearDepositState, 7000)
      return () => clearTimeout(timeoutId)
    },
    [
      addEvmDepositToTunnelHistory,
      clearDepositState,
      depositReceipt,
      fromInput,
      fromNetworkId,
      fromToken,
      hasClearedForm,
      resetStateAfterOperation,
      setHasClearedForm,
      setOperationRunning,
      toToken,
      walletClient,
    ],
  )

  useEffect(
    function handleErrors() {
      if (
        approvalError ||
        approvalReceiptError ||
        depositError ||
        depositReceiptError
      ) {
        const timeoutId = setTimeout(clearDepositState, 7000)
        if (!hasClearedForm) {
          setHasClearedForm(true)
          setOperationRunning('idle')
          resetStateAfterOperation()
          setExtendedErc20Approval(false)
        }
        return () => clearTimeout(timeoutId)
      }
      return undefined
    },
    [
      approvalError,
      approvalReceiptError,
      depositError,
      depositReceiptError,
      clearDepositState,
      hasClearedForm,
      resetStateAfterOperation,
      setExtendedErc20Approval,
      setOperationRunning,
      setHasClearedForm,
    ],
  )

  const isRunningOperation = operationRunning !== 'idle'

  const handleDeposit = function () {
    setDepositAmount(fromInput)
    clearDepositState()
    deposit()
    setHasClearedForm(false)
    if (needsApproval) {
      setOperationRunning('approving')
    } else {
      setOperationRunning('depositing')
    }
  }

  const totalDeposit = operatesNativeToken
    ? getTotal({
        fees: depositGasFees,
        fromInput,
        fromToken,
      })
    : getTotal({
        fromInput,
        fromToken,
      })

  const approvalTransactionList = useTransactionsList({
    inProgressMessage: t('tunnel-page.transaction-status.erc20-approving', {
      symbol: fromToken.symbol,
    }),
    isOperating: operationRunning === 'approving',
    operation: 'approve',
    receipt: approvalReceipt,
    receiptError: approvalReceiptError,
    successMessage: t('tunnel-page.transaction-status.erc20-approved', {
      symbol: fromToken.symbol,
    }),
    txHash: approvalTxHash,
    userConfirmationError: approvalError,
  })

  const depositTransactionList = useTransactionsList({
    inProgressMessage: t('tunnel-page.transaction-status.depositing', {
      fromInput: getFormattedValue(depositAmount),
      symbol: fromToken.symbol,
    }),
    isOperating: operationRunning === 'depositing',
    operation: 'deposit',
    receipt: depositReceipt,
    receiptError: depositReceiptError,
    successMessage: t('tunnel-page.transaction-status.deposited', {
      fromInput: getFormattedValue(depositAmount),
      symbol: fromToken.symbol,
    }),
    txHash: depositTxHash,
    userConfirmationError: depositError,
  })

  const transactionsList = approvalTransactionList.concat(
    depositTransactionList,
  )

  const gas = {
    amount: formatNumber(
      formatUnits(
        depositGasFees + approvalTokenGasFees,
        fromChain?.nativeCurrency.decimals,
      ),
      3,
    ),
    label: t('common.network-gas-fee', { network: fromChain?.name }),
    symbol: fromChain?.nativeCurrency.symbol,
  }

  return (
    <TunnelForm
      expectedChainId={fromNetworkId}
      explorerUrl={fromChain.blockExplorers.default.url}
      formContent={
        <FormContent
          isRunningOperation={isRunningOperation}
          setMaxBalanceButton={
            <SetMaxEvmBalance
              fromToken={fromToken}
              gas={depositGasFees}
              isRunningOperation={isRunningOperation}
              onSetMaxBalance={maxBalance => updateFromInput(maxBalance)}
            />
          }
          tunnelState={{
            ...state,
            // patch these events to update the extendedErc20Approval state
            toggleInput() {
              // toToken becomes fromToken, so we must check that one
              if (isNativeToken(state.toToken)) {
                setExtendedErc20Approval(false)
              }
              state.toggleInput()
            },
            updateFromNetwork(payload: number) {
              setExtendedErc20Approval(false)
              state.updateFromNetwork(payload)
            },
            updateFromToken(payload: EvmToken) {
              if (isNativeToken(payload)) {
                setExtendedErc20Approval(false)
              }
              state.updateFromToken(payload)
            },
          }}
        />
      }
      onSubmit={handleDeposit}
      reviewSummary={
        canDeposit ? (
          <EvmSummary
            gas={gas}
            operationSymbol={fromToken.symbol}
            total={totalDeposit}
          />
        ) : null
      }
      submitButton={
        <SubmitButton
          canDeposit={canDeposit}
          extendedErc20Approval={extendedErc20Approval}
          fromToken={fromToken}
          isRunningOperation={isRunningOperation}
          needsApproval={needsApproval}
          operationRunning={operationRunning}
          updateExtendedErc20Approval={() =>
            setExtendedErc20Approval(prev => !prev)
          }
        />
      }
      transactionsList={transactionsList}
    />
  )
}

export const Deposit = function ({
  state,
}: {
  state: ReturnType<typeof useTunnelState>
}) {
  const { fromNetworkId } = state
  const chain = useChain(fromNetworkId)

  // Typescript can't infer it, but we can cast these safely
  if (isEvmNetwork(chain)) {
    return <EvmDeposit state={state as TypedTunnelState<EvmTunneling>} />
  }
  return <BtcDeposit state={state as TypedTunnelState<BtcToHemiTunneling>} />
}
