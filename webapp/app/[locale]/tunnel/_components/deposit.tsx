'use client'

import { MessageDirection } from '@eth-optimism/sdk'
import { useBalance as useBtcBalance } from 'btc-wallet/hooks/useBalance'
import { Button } from 'components/button'
import { addTimestampToOperation } from 'context/tunnelHistoryContext/operations'
import { useAccounts } from 'hooks/useAccounts'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useBitcoin } from 'hooks/useBitcoin'
import { useBtcDeposits } from 'hooks/useBtcDeposits'
import { useDepositBitcoin } from 'hooks/useBtcTunnel'
import { useChain } from 'hooks/useChain'
import { useGetFeePrices } from 'hooks/useEstimateBtcFees'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { NativeTokenSpecialAddressOnL2 } from 'tokenList'
import { type EvmToken } from 'types/token'
import { BtcDepositStatus, EvmDepositOperation } from 'types/tunnel'
import { isEvmNetwork } from 'utils/chain'
import { formatEvmAddress, formatNumber, getFormattedValue } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { formatUnits, parseUnits, zeroAddress } from 'viem'
import { useAccount as useEvmAccount } from 'wagmi'

import { useAfterTransaction } from '../_hooks/useAfterTransaction'
import { useDeposit } from '../_hooks/useDeposit'
import { useTransactionsList } from '../_hooks/useTransactionsList'
import { useTunnelOperation } from '../_hooks/useTunnelOperation'
import {
  type BtcToHemiTunneling,
  type EvmTunneling,
  useTunnelState,
  TypedTunnelState,
} from '../_hooks/useTunnelState'
import { canSubmit, getTotal } from '../_utils'

import { BtcFees } from './btcFees'
import { ConnectEvmWallet } from './connectEvmWallet'
import { Erc20TokenApproval } from './erc20TokenApproval'
import { EvmSummary } from './evmSummary'
import { FormContent, TunnelForm } from './form'
import { ReceivingAddress } from './receivingAddress'
import { SubmitWithTwoWallets } from './submitWithTwoWallets'

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

const SubmitEvmDeposit = function ({
  canDeposit,
  isRunningOperation,
  needsApproval,
  operationRunning,
}: {
  canDeposit: boolean
  isRunningOperation: boolean
  needsApproval: boolean
  operationRunning: OperationRunning
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
    <Button disabled={!canDeposit || isRunningOperation} type="submit">
      {getOperationButtonText()}
    </Button>
  )
}

type BtcDepositProps = {
  state: TypedTunnelState<BtcToHemiTunneling>
}

const BtcDeposit = function ({ state }: BtcDepositProps) {
  const deposits = useBtcDeposits()
  const { updateDeposit } = useTunnelHistory()
  // use this to hold the deposited amount for the Tx list after clearing the state upon confirmation
  const [depositAmount, setDepositAmount] = useState('0')
  const [isDepositing, setIsDepositing] = useState(false)

  const {
    fromInput,
    fromNetworkId,
    fromToken,
    resetStateAfterOperation,
    savePartialDeposit,
    toNetworkId,
    updateFromInput,
  } = state

  const { evmAddress } = useAccounts()
  const bitcoin = useBitcoin()
  const { balance } = useBtcBalance()
  const chain = useChain(bitcoin.id)
  const { txHash } = useTunnelOperation()

  const canDeposit = canSubmit({
    balance: BigInt(balance?.confirmed ?? 0),
    chainId: bitcoin.id,
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

  const resetFormState = useCallback(
    function () {
      setIsDepositing(false)
      resetStateAfterOperation()
    },
    [resetStateAfterOperation, setIsDepositing],
  )

  const onSuccess = useCallback(
    function () {
      resetFormState()
      const deposit = deposits.find(
        d => d.transactionHash === depositReceipt.txId,
      )
      updateDeposit(deposit, {
        blockNumber: depositReceipt.status.blockHeight,
        status: BtcDepositStatus.TX_CONFIRMED,
        timestamp: depositReceipt.status.blockTime,
      })
      savePartialDeposit({ depositTxHash: depositReceipt.txId })
    },
    [
      depositReceipt,
      deposits,
      resetFormState,
      savePartialDeposit,
      updateDeposit,
    ],
  )

  const { beforeTransaction } = useAfterTransaction({
    clearState: clearDepositState,
    errorReceipts: [depositError, depositReceiptError],
    onError: resetFormState,
    onSuccess,
    transactionReceipt: depositReceipt,
  })

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
    beforeTransaction()
    setDepositAmount(fromInput)
    setIsDepositing(true)
    depositBitcoin({
      hemiAddress: evmAddress,
      l1ChainId: fromNetworkId,
      l2ChainId: toNetworkId,
      satoshis: Number(parseUnits(fromInput, fromToken.decimals)),
    })
  }

  const fees = feePrices?.fastestFee?.toString()

  return (
    <>
      <TunnelForm
        bottomSection={<WalletsConnected />}
        expectedChainId={chain.id}
        explorerUrl={chain.blockExplorers.default.url}
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
              <ReceivingAddress
                address={evmAddress ? formatEvmAddress(evmAddress) : undefined}
                receivingText={t('tunnel-page.form.hemi-receiving-address')}
                tooltipText={t(
                  'tunnel-page.form.hemi-receiving-address-description',
                  {
                    symbol: state.fromToken.symbol,
                  },
                )}
              />
            </div>
            <SubmitWithTwoWallets
              disabled={!canDeposit || isDepositing}
              text={t('tunnel-page.submit-button.deposit')}
            />
          </>
        }
        transactionsList={transactionsList}
      />
      {!!txHash && (
        <ReviewBtcDeposit
          chain={chain}
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
  const { addDepositToTunnelHistory } = useTunnelHistory()
  // use this to hold the deposited amount for the Tx list after clearing the state upon confirmation
  const [depositAmount, setDepositAmount] = useState('0')
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
    toNetworkId,
    updateFromInput,
  } = state

  const { chain, isConnected } = useEvmAccount()

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

  const resetFormState = useCallback(
    function () {
      resetStateAfterOperation()
      setExtendedErc20Approval(false)
      setOperationRunning('idle')
    },
    [resetStateAfterOperation, setExtendedErc20Approval, setOperationRunning],
  )

  const onSuccess = useCallback(
    function () {
      resetFormState()
      const isNative = isNativeToken(fromToken)
      // Handling of this error is needed https://github.com/hemilabs/ui-monorepo/issues/322
      // eslint-disable-next-line promise/catch-or-return
      addTimestampToOperation<EvmDepositOperation>(
        {
          amount: parseUnits(fromInput, fromToken.decimals).toString(),
          blockNumber: Number(depositReceipt.blockNumber),
          direction: MessageDirection.L1_TO_L2,
          from: depositReceipt.from,
          l1ChainId: fromNetworkId,
          l1Token: isNative ? zeroAddress : fromToken.address,
          l2ChainId: toNetworkId,
          l2Token: isNative ? NativeTokenSpecialAddressOnL2 : toToken.address,
          // "to" field uses the same address as from, which is user's address
          to: depositReceipt.from,
          transactionHash: depositReceipt.transactionHash,
        },
        fromToken.chainId,
      ).then(addDepositToTunnelHistory)
    },
    [
      addDepositToTunnelHistory,
      depositReceipt,
      fromInput,
      fromNetworkId,
      fromToken,
      resetFormState,
      toNetworkId,
      toToken,
    ],
  )

  const { beforeTransaction } = useAfterTransaction({
    clearState: clearDepositState,
    errorReceipts: [
      approvalError,
      approvalReceiptError,
      depositError,
      depositReceiptError,
    ],
    onError: resetFormState,
    onSuccess,
    transactionReceipt: depositReceipt,
  })

  const isRunningOperation = operationRunning !== 'idle'

  const handleDeposit = function () {
    beforeTransaction()
    setDepositAmount(fromInput)
    clearDepositState()
    deposit()
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
          tokenApproval={
            operatesNativeToken ? null : (
              <Erc20TokenApproval
                checked={extendedErc20Approval}
                disabled={!needsApproval || isRunningOperation}
                onCheckedChange={() => setExtendedErc20Approval(prev => !prev)}
              />
            )
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
        isConnected ? (
          <SubmitEvmDeposit
            canDeposit={canDeposit}
            isRunningOperation={isRunningOperation}
            needsApproval={needsApproval}
            operationRunning={operationRunning}
          />
        ) : (
          <ConnectEvmWallet />
        )
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
