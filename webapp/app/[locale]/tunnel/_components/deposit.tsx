'use client'

import { useUmami } from 'app/analyticsEvents'
import { useBalance as useBtcBalance } from 'btc-wallet/hooks/useBalance'
import { Button } from 'components/button'
import { useAccounts } from 'hooks/useAccounts'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useBitcoin } from 'hooks/useBitcoin'
import { useBtcDeposits } from 'hooks/useBtcDeposits'
import { useDepositBitcoin } from 'hooks/useBtcTunnel'
import { useChain } from 'hooks/useChain'
import { useGetFeePrices } from 'hooks/useEstimateBtcFees'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { type EvmToken } from 'types/token'
import { BtcDepositStatus } from 'types/tunnel'
import { isEvmNetwork } from 'utils/chain'
import { formatEvmAddress, formatNumber, getFormattedValue } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { formatUnits, parseUnits } from 'viem'
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
        belowForm={
          <div className="relative -z-10 -translate-y-7">
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
            {fees !== undefined ? <BtcFees fees={fees} /> : null}
          </div>
        }
        bottomSection={<WalletsConnected />}
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
        submitButton={
          <SubmitWithTwoWallets
            disabled={!canDeposit || isDepositing}
            text={t('tunnel-page.submit-button.deposit')}
          />
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
  const [networkType] = useNetworkType()
  // use this to be able to show state boxes before user confirmation (mutation isn't finished)
  const [operationRunning, setOperationRunning] =
    useState<OperationRunning>('idle')

  // use this state to toggle the Erc20 token approval
  const [extendedErc20Approval, setExtendedErc20Approval] = useState(false)

  const t = useTranslations()
  const { track } = useUmami()

  const {
    fromInput,
    fromNetworkId,
    fromToken,
    resetStateAfterOperation,
    toToken,
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
    approvalTokenGasFees = BigInt(0),
    clearDepositState,
    needsApproval,
    deposit,
    depositError,
    depositGasFees,
    depositReceipt,
    depositReceiptError,
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

  useEffect(
    function handleSuccess() {
      if (
        depositReceipt?.status !== 'success' ||
        operationRunning !== 'depositing'
      ) {
        return
      }
      setOperationRunning('idle')
      resetStateAfterOperation()
      setExtendedErc20Approval(false)
      track?.('evm - dep success', { chain: networkType })
    },
    [
      depositReceipt,
      networkType,
      operationRunning,
      resetStateAfterOperation,
      setExtendedErc20Approval,
      setOperationRunning,
      track,
    ],
  )

  useEffect(
    function handleRejectionOrFailure() {
      if (
        (approvalError ||
          approvalReceiptError ||
          depositError ||
          depositReceiptError) &&
        operationRunning !== 'idle'
      ) {
        setOperationRunning('idle')
        track?.('evm - dep failed', { chain: networkType })
      }
    },
    [
      approvalError,
      approvalReceiptError,
      networkType,
      depositError,
      depositReceiptError,
      operationRunning,
      setOperationRunning,
      track,
    ],
  )

  const isRunningOperation = operationRunning !== 'idle'

  const handleDeposit = function () {
    clearDepositState()
    deposit()
    if (needsApproval) {
      setOperationRunning('approving')
    } else {
      setOperationRunning('depositing')
    }
    track?.('evm - dep started', { chain: networkType })
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
      belowForm={
        canDeposit ? (
          <EvmSummary
            gas={gas}
            operationSymbol={fromToken.symbol}
            total={totalDeposit}
          />
        ) : null
      }
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
