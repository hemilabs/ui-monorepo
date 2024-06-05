'use client'

import { MessageDirection } from '@eth-optimism/sdk'
import { TunnelHistoryContext } from 'context/tunnelHistoryContext'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useChain } from 'hooks/useChain'
import { useTranslations } from 'next-intl'
import { ReactNode, useContext, useEffect, useState } from 'react'
import { NativeTokenSpecialAddressOnL2 } from 'tokenList'
import { Token } from 'types/token'
import { Button } from 'ui-common/components/button'
import { formatNumber, getFormattedValue } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { formatUnits, parseUnits, zeroAddress } from 'viem'
import { useAccount } from 'wagmi'

import { useDeposit } from '../_hooks/useDeposit'
import { useTransactionsList } from '../_hooks/useTransactionsList'
import { useTunnelState } from '../_hooks/useTunnelState'

import { Erc20Approval } from './Erc20Approval'
import { TunnelForm, canSubmit, getTotal } from './form'

type OperationRunning = 'idle' | 'approving' | 'depositing'

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

type Props = {
  renderForm: (isRunningOperation: boolean) => ReactNode
  state: ReturnType<typeof useTunnelState>
}

export const Deposit = function ({ renderForm, state }: Props) {
  const { addDepositToTunnelHistory } = useContext(TunnelHistoryContext)
  // use this to hold the deposited amount for the Tx list after clearing the state upon confirmation
  const [depositAmount, setDepositAmount] = useState('0')
  // use this to avoid infinite loops in effects when resetting the form
  const [hasClearedForm, setHasClearedForm] = useState(false)
  // use this to be able to show state boxes before user confirmation (mutation isn't finished)
  const [operationRunning, setOperationRunning] =
    useState<OperationRunning>('idle')

  const t = useTranslations()

  const {
    extendedErc20Approval,
    fromInput,
    fromNetworkId,
    fromToken,
    resetStateAfterOperation,
    updateExtendedErc20Approval,
    toToken,
  } = state

  const { chain } = useAccount()

  const operatesNativeToken = isNativeToken(fromToken)

  const { balance: walletNativeTokenBalance } = useNativeTokenBalance(
    fromToken.chainId,
  )

  const { balance: walletTokenBalance } = useTokenBalance(
    fromToken,
    !operatesNativeToken,
  )

  const canDeposit = canSubmit({
    chainId: chain?.id,
    fromInput,
    fromNetworkId,
    fromToken,
    walletNativeTokenBalance,
    walletTokenBalance,
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

  useEffect(
    function handleDepositSuccess() {
      if (depositReceipt?.status === 'success') {
        const timeoutId = setTimeout(clearDepositState, 7000)
        if (!hasClearedForm) {
          setHasClearedForm(true)
          setOperationRunning('idle')
          resetStateAfterOperation()
          const isNative = isNativeToken(fromToken)
          addDepositToTunnelHistory({
            amount: parseUnits(fromInput, fromToken.decimals).toString(),
            blockNumber: Number(depositReceipt.blockNumber),
            data: '0x', // not needed
            direction: MessageDirection.L1_TO_L2,
            from: depositReceipt.from,
            l1Token: isNative ? zeroAddress : fromToken.address,
            l2Token: isNative ? NativeTokenSpecialAddressOnL2 : toToken.address,
            logIndex: 0, // not needed
            // "to" field uses the same address as from, which is user's address
            to: depositReceipt.from,
            transactionHash: depositReceipt.transactionHash,
          })
        }
        return () => clearTimeout(timeoutId)
      }
      return undefined
    },
    [
      addDepositToTunnelHistory,
      clearDepositState,
      depositReceipt,
      fromInput,
      fromToken,
      hasClearedForm,
      resetStateAfterOperation,
      setOperationRunning,
      setHasClearedForm,
      toToken,
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

  return (
    <TunnelForm
      expectedChainId={fromNetworkId}
      formContent={renderForm(isRunningOperation)}
      gas={{
        amount: formatNumber(
          formatUnits(
            depositGasFees + approvalTokenGasFees,
            fromChain?.nativeCurrency.decimals,
          ),
          3,
        ),
        label: t('common.network-gas-fee', { network: fromChain?.name }),
        symbol: fromChain?.nativeCurrency.symbol,
      }}
      onSubmit={handleDeposit}
      operationSymbol={fromToken.symbol}
      showReview={canDeposit}
      submitButton={
        <SubmitButton
          canDeposit={canDeposit}
          extendedErc20Approval={extendedErc20Approval}
          fromToken={fromToken}
          isRunningOperation={isRunningOperation}
          needsApproval={needsApproval}
          operationRunning={operationRunning}
          updateExtendedErc20Approval={updateExtendedErc20Approval}
        />
      }
      total={totalDeposit}
      transactionsList={transactionsList}
    />
  )
}
