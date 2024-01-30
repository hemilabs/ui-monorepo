'use client'

import { useBridgeState } from 'app/bridge/useBridgeState'
import { useDeposit } from 'app/bridge/useDeposit'
import { useTransactionsList } from 'app/bridge/useTransactionsList'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import dynamic from 'next/dynamic'
import { FormEvent, ReactNode, useEffect } from 'react'
import Skeleton from 'react-loading-skeleton'
import { formatNumber } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { formatUnits } from 'viem'
import { useConfig } from 'wagmi'

import { BridgeForm, canSubmit, getTotal } from './form'

const Erc20Approval = dynamic(
  () =>
    import('app/bridge/_components/Erc20Approval').then(
      mod => mod.Erc20Approval,
    ),
  {
    loading: () => (
      <Skeleton className="h-10 py-2" containerClassName="basis-1/4" />
    ),
    ssr: false,
  },
)

const OperationButton = dynamic(
  () =>
    import('app/bridge/_components/OperationButton').then(
      mod => mod.OperationButton,
    ),
  {
    loading: () => <Skeleton className="h-14" />,
    ssr: false,
  },
)

const ReviewDeposit = dynamic(
  () => import('components/reviewBox').then(mod => mod.ReviewDeposit),
  {
    loading: () => <Skeleton className="h-48 w-full md:w-80" />,
    ssr: false,
  },
)

const TransactionStatus = dynamic(
  () =>
    import('components/transactionStatus').then(mod => mod.TransactionStatus),
  {
    ssr: false,
  },
)

type Props = {
  renderForm: (isRunningOperation: boolean) => ReactNode
  state: ReturnType<typeof useBridgeState>
}

export const Deposit = function ({ renderForm, state }: Props) {
  const {
    extendedErc20Approval,
    fromInput,
    fromNetworkId,
    fromToken,
    updateExtendedErc20Approval,
    updateFromInput,
    toNetworkId,
    toToken,
  } = state

  const { chains = [] } = useConfig()

  const operatesNativeToken = isNativeToken(fromToken)

  const { balance: walletNativeTokenBalance } = useNativeTokenBalance(
    fromToken.chainId,
  )

  const { balance: walletTokenBalance } = useTokenBalance(
    fromToken,
    !operatesNativeToken,
  )

  const canDeposit = canSubmit({
    fromInput,
    fromToken,
    walletNativeTokenBalance,
    walletTokenBalance,
  })

  const {
    addTransaction,
    clearTransactionList,
    delayedClearTransactionList,
    transactionsList,
    updateTransaction,
  } = useTransactionsList()

  const fromChain = chains.find(c => c.id === fromNetworkId)
  const toChain = chains.find(c => c.id === toNetworkId)

  const {
    approvalTxHash,
    approvalTokenGasFees = BigInt(0),
    approvalStatus,
    needsApproval,
    deposit,
    depositGasFees,
    depositStatus,
    depositTxHash,
    userDepositConfirmation,
    userConfirmationApprovalStatus,
  } = useDeposit({
    canDeposit,
    extendedErc20Approval: operatesNativeToken
      ? undefined
      : extendedErc20Approval,
    fromInput,
    fromToken,
    onApprovalError() {
      updateTransaction({
        id: 'approval',
        status: 'error',
        text: 'Tx failed',
      })
    },
    onApprovalSuccess() {
      addTransaction({
        id: 'deposit',
        status: 'loading',
        text: `Depositing ${fromInput} ${fromToken.symbol} to ${toChain?.name}`,
      })
      updateTransaction({
        id: 'approval',
        status: 'success',
        text: `${fromToken.symbol} Approved`,
      })
    },
    onDepositError() {
      updateTransaction({
        id: 'deposit',
        status: 'error',
        text: 'Tx failed',
      })
      delayedClearTransactionList()
    },
    onDepositSuccess() {
      updateTransaction({
        id: 'deposit',
        status: 'success',
        text: `${fromInput} ${fromToken.symbol} deposited`,
      })
      updateFromInput('0')
      if (extendedErc20Approval) {
        updateExtendedErc20Approval()
      }
      delayedClearTransactionList(7000)
    },
    toToken,
  })

  const isRunningOperation = [
    approvalStatus,
    depositStatus,
    userConfirmationApprovalStatus,
    userDepositConfirmation,
  ].includes('loading')

  const handleDeposit = function (e: FormEvent) {
    e.preventDefault()
    clearTransactionList()
    deposit()
    if (needsApproval) {
      addTransaction({
        id: 'approval',
        status: 'loading',
        text: `Approving ${fromToken.symbol}`,
      })
    } else {
      addTransaction({
        id: 'deposit',
        status: 'loading',
        text: `Depositing ${fromInput} ${fromToken.symbol} to ${toChain?.name}`,
      })
    }
  }

  useEffect(
    function updateApprovalTransactionsAfterUserReject() {
      if (userConfirmationApprovalStatus === 'error') {
        updateTransaction({
          id: 'approval',
          status: 'error',
          text: 'Tx rejected',
        })
        return delayedClearTransactionList()
      }
      return undefined
    },
    [
      delayedClearTransactionList,
      userConfirmationApprovalStatus,
      updateTransaction,
    ],
  )

  useEffect(
    function addApprovalTxOnceAvailable() {
      if (approvalTxHash) {
        updateTransaction({
          id: 'approval',
          txHash: approvalTxHash,
        })
      }
    },
    [approvalTxHash, updateTransaction],
  )

  useEffect(
    function addDepositTxHashOnceAvailable() {
      if (depositTxHash) {
        updateTransaction({
          id: 'deposit',
          txHash: depositTxHash,
        })
      }
    },
    [depositTxHash, updateTransaction],
  )

  useEffect(
    function updateDepositTransactionsAfterUserReject() {
      if (userDepositConfirmation === 'error') {
        updateTransaction({
          id: 'deposit',
          status: 'error',
          text: 'Tx rejected',
        })
        return delayedClearTransactionList()
      }
      return undefined
    },
    [delayedClearTransactionList, userDepositConfirmation, updateTransaction],
  )

  const getOperationButtonText = function () {
    const texts = {
      approve: {
        idle: 'Approve and Deposit',
        loading: 'Approving...',
      },
      deposit: {
        idle: 'Deposit',
        loading: 'Depositing...',
      },
    }
    if (!isRunningOperation) {
      return texts[needsApproval ? 'approve' : 'deposit'].idle
    }
    if (
      userConfirmationApprovalStatus === 'loading' ||
      approvalStatus === 'loading'
    ) {
      return texts.approve.loading
    }
    if (userDepositConfirmation === 'loading' || depositStatus === 'loading') {
      return texts.deposit.loading
    }
    return texts.deposit.idle
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
        <>
          <Erc20Approval
            checked={extendedErc20Approval}
            disabled={
              isNativeToken(fromToken) || !needsApproval || isRunningOperation
            }
            onCheckedChange={updateExtendedErc20Approval}
          />
          <OperationButton
            disabled={!canDeposit || isRunningOperation}
            text={getOperationButtonText()}
          />
        </>
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
