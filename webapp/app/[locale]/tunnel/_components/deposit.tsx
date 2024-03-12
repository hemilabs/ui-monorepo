'use client'

import { ReviewDeposit } from 'components/reviewBox/reviewDeposit'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { ReactNode, useEffect, useState } from 'react'
import { Token } from 'types/token'
import { Button } from 'ui-common/components/button'
import { formatNumber } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { Chain, formatUnits } from 'viem'
import {
  useAccount,
  useConfig,
  type UseWaitForTransactionReceiptReturnType,
} from 'wagmi'

import { useBridgeState } from '../_hooks/useBridgeState'
import { useDeposit } from '../_hooks/useDeposit'

import { Erc20Approval } from './Erc20Approval'
import { BridgeForm, canSubmit, getTotal } from './form'

const TransactionStatus = dynamic(
  () =>
    import('components/transactionStatus').then(mod => mod.TransactionStatus),
  {
    ssr: false,
  },
)

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
        idle: t('bridge-page.submit-button.approve-and-deposit'),
        loading: t('bridge-page.submit-button.approving'),
      },
      deposit: {
        idle: t('bridge-page.submit-button.deposit'),
        loading: t('bridge-page.submit-button.depositing'),
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

type UseUiTransactionsList = {
  approvalError: Error | undefined
  approvalTxHash: string | undefined
  approvalReceipt: UseWaitForTransactionReceiptReturnType['data'] | undefined
  approvalReceiptError: Error | undefined
  depositError: Error | undefined
  depositReceipt: UseWaitForTransactionReceiptReturnType['data'] | undefined
  depositReceiptError: Error | undefined
  depositTxHash: string | undefined
  deposited: string
  fromToken: Token
  operationRunning: OperationRunning
  toChain: Chain | undefined
}
const useTransactionList = function ({
  approvalError,
  approvalTxHash,
  approvalReceipt,
  approvalReceiptError,
  depositError,
  depositTxHash,
  depositReceipt,
  depositReceiptError,
  deposited,
  fromToken,
  operationRunning,
  toChain,
}: UseUiTransactionsList) {
  const t = useTranslations()
  const transactionsList = []

  if (approvalError) {
    // user rejected the approval request
    if (
      ['user rejected', 'denied transaction signature'].includes(
        approvalError.message,
      )
    ) {
      transactionsList.push({
        id: 'approval',
        status: 'error',
        text: t('common.transaction-status.rejected'),
      })
    } else {
      // failed for some reason before sending the tx to the node (no tx hash)
      transactionsList.push({
        id: 'approval',
        status: 'error',
        text: t('common.transaction-status.error'),
      })
    }
  }

  // user has given confirmation for the approval and there's a tx hash
  // or is looking at the confirmation prompt
  if (approvalTxHash || (operationRunning === 'approving' && !approvalError)) {
    // approval failed for some reason
    if (approvalReceiptError) {
      transactionsList.push({
        id: 'approval',
        status: 'error',
        text: t('common.transaction-status.error'),
      })
    }
    if (approvalReceipt?.status === 'success') {
      // approval confirmed
      transactionsList.push({
        id: 'approval',
        status: 'success',
        text: t('bridge-page.transaction-status.erc20-approved', {
          symbol: fromToken.symbol,
        }),
      })
    }
    // approval in progress
    if (!approvalReceipt) {
      transactionsList.push({
        id: 'approval',
        status: 'loading',
        text: t('bridge-page.transaction-status.erc20-approving', {
          symbol: fromToken.symbol,
        }),
        txHash: approvalTxHash,
      })
    }
  }

  if (depositError) {
    // user rejected the request
    if (
      ['user rejected', 'denied transaction signature'].includes(
        depositError.message,
      )
    ) {
      transactionsList.push({
        id: 'deposit',
        status: 'error',
        text: t('common.transaction-status.rejected'),
      })
    } else {
      // failed for some reason before sending the tx to the node (no tx hash)
      transactionsList.push({
        id: 'deposit',
        status: 'error',
        text: t('common.transaction-status.error'),
      })
    }
  }
  // user has given confirmation for the deposit and there's a tx hash
  // or is looking at the confirmation prompt
  if (depositTxHash || (operationRunning === 'depositing' && !depositError)) {
    // deposit failed for some reason
    if (depositReceiptError) {
      transactionsList.push({
        id: 'deposit',
        status: 'error',
        text: t('common.transaction-status.error'),
      })
    }
    // deposit was successful
    if (depositReceipt?.status === 'success') {
      transactionsList.push({
        id: 'deposit',
        status: 'success',
        text: t('bridge-page.transaction-status.deposited', {
          fromInput: deposited,
          symbol: fromToken.symbol,
        }),
      })
    }
    // deposit in progress
    if (!depositReceipt) {
      transactionsList.push({
        id: 'deposit',
        status: 'loading',
        text: t('bridge-page.transaction-status.depositing', {
          fromInput: deposited,
          network: toChain?.name,
          symbol: fromToken.symbol,
        }),
        txHash: depositTxHash,
      })
    }
  }
  return transactionsList
}

type Props = {
  renderForm: (isRunningOperation: boolean) => ReactNode
  state: ReturnType<typeof useBridgeState> & { operation: 'deposit' }
}

export const Deposit = function ({ renderForm, state }: Props) {
  // use this to hold the deposited amount for the Tx list after clearing the state upon confirmation
  const [depositAmount, setDepositAmount] = useState('0')
  // use this to avoid infinite loops in effects when resetting the form
  const [hasClearedForm, setHasClearedForm] = useState(false)
  // use this to be able to show state boxes before user confirmation (mutation isn't finished)
  const [operationRunning, setOperationRunning] =
    useState<OperationRunning>('idle')

  const {
    extendedErc20Approval,
    fromInput,
    fromNetworkId,
    fromToken,
    resetStateAfterOperation,
    updateExtendedErc20Approval,
    toNetworkId,
    toToken,
  } = state

  const { chains = [] } = useConfig()
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

  const fromChain = chains.find(c => c.id === fromNetworkId)
  const toChain = chains.find(c => c.id === toNetworkId)

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

  const depositReceiptStatus = depositReceipt?.status
  useEffect(
    function handleDepositSuccess() {
      if (depositReceiptStatus === 'success') {
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
      clearDepositState,
      depositReceiptStatus,
      hasClearedForm,
      resetStateAfterOperation,
      setOperationRunning,
      setHasClearedForm,
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

  const transactionsList = useTransactionList({
    approvalError,
    approvalReceipt,
    approvalReceiptError,
    approvalTxHash,
    deposited: depositAmount,
    depositError,
    depositReceipt,
    depositReceiptError,
    depositTxHash,
    fromToken,
    operationRunning,
    toChain,
  })

  return (
    <BridgeForm
      formContent={renderForm(isRunningOperation)}
      onSubmit={handleDeposit}
      reviewOperation={
        <ReviewDeposit
          canDeposit={canDeposit}
          deposit={formatNumber(fromInput, 3)}
          depositSymbol={fromToken.symbol}
          gas={formatNumber(
            formatUnits(
              depositGasFees + approvalTokenGasFees,
              fromChain?.nativeCurrency.decimals,
            ),
            3,
          )}
          gasSymbol={fromChain?.nativeCurrency.symbol}
          total={formatNumber(totalDeposit, 3)}
        />
      }
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
