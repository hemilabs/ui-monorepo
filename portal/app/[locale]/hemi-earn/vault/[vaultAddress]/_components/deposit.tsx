'use client'

import { HemiFees } from 'components/hemiFees'
import { encodeDepositToken } from 'hemi-earn-actions/actions'
import { useTokenBalance } from 'hooks/useBalance'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemi } from 'hooks/useHemi'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { parseTokenUnits } from 'utils/token'
import { validateSubmit } from 'utils/validateSubmit'
import { walletIsConnected } from 'utils/wallet'
import { type Address } from 'viem'
import { useAccount as useEvmAccount, useEstimateGas } from 'wagmi'

import { useVaultForm } from '../_context/vaultFormContext'
import { useDeposit } from '../_hooks/useDeposit'
import { type VaultDepositOperationRunning } from '../_types/vaultOperations'

import { VaultFormLayout } from './form'
import { SubmitDeposit } from './submitDeposit'
import { VaultFormContent } from './vaultFormContent'

const SetMaxEvmBalance = dynamic(
  () => import('components/setMaxBalance').then(mod => mod.SetMaxEvmBalance),
  { ssr: false },
)

type Props = {
  onSwitchToWithdraw: VoidFunction
}

export const Deposit = function ({ onSwitchToWithdraw }: Props) {
  const t = useTranslations()
  const [operationRunning, setOperationRunning] =
    useState<VaultDepositOperationRunning>('idle')

  const {
    input,
    pool,
    resetStateAfterOperation,
    updateDepositOperation,
    updateInput,
  } = useVaultForm()

  const { address, status } = useEvmAccount()
  const hemi = useHemi()

  const amount = parseTokenUnits(input, pool.token)

  const { isAllowanceError, isAllowanceLoading, needsApproval } =
    useNeedsApproval({
      address: pool.token.address,
      amount,
      chainId: pool.token.chainId,
      spender: pool.vaultAddress,
    })

  const { data: walletTokenBalance, isSuccess: tokenBalanceLoaded } =
    useTokenBalance(pool.token.chainId, pool.token.address)

  const {
    canSubmit: validInput,
    error: validationError,
    errorKey,
  } = validateSubmit({
    amountInput: input,
    balance: walletTokenBalance,
    operation: 'deposit',
    t,
    token: pool.token,
  })

  const canDeposit = validInput

  const { fees: approvalGasFees, isError: isApprovalGasFeesError } =
    useEstimateApproveErc20Fees({
      amount,
      spender: pool.vaultAddress,
      token: pool.token,
    })

  const { data: depositGasUnits, isError: isDepositGasUnitsError } =
    useEstimateGas({
      data:
        canDeposit && address
          ? encodeDepositToken({ amount, receiver: address })
          : undefined,
      query: { enabled: canDeposit && !!address },
      to: pool.vaultAddress as Address,
    })

  const { fees: depositGasFees, isError: isDepositGasFeesError } =
    useEstimateFees({
      chainId: hemi.id,
      gasUnits: depositGasUnits,
      isGasUnitsError: isDepositGasUnitsError,
    })

  const totalFees =
    depositGasFees + (needsApproval ? approvalGasFees : BigInt(0))
  const isFeesError =
    isDepositGasFeesError || (needsApproval && isApprovalGasFeesError)

  const { isPending: isRunningOperation, mutate: deposit } = useDeposit({
    input,
    on(emitter) {
      emitter.on('approve-transaction-succeeded', () =>
        setOperationRunning('depositing'),
      )
      emitter.on('deposit-transaction-succeeded', function () {
        resetStateAfterOperation()
      })
      emitter.on('deposit-settled', () => setOperationRunning('idle'))
    },
    pool,
    updateDepositOperation,
  })

  const handleDeposit = function () {
    if (!canDeposit) {
      return
    }
    deposit(undefined, {
      onError: () => setOperationRunning('idle'),
    })
    setOperationRunning(needsApproval ? 'approving' : 'depositing')
  }

  function RenderBelowForm() {
    if (!canDeposit) {
      return null
    }
    return <HemiFees fees={totalFees} isError={isFeesError} />
  }

  return (
    <VaultFormLayout
      belowForm={<RenderBelowForm />}
      formContent={
        <VaultFormContent
          activeTab="deposit"
          errorKey={
            walletIsConnected(status) && tokenBalanceLoaded
              ? errorKey
              : undefined
          }
          isRunningOperation={isRunningOperation}
          onSwitchTab={onSwitchToWithdraw}
          setMaxBalanceButton={
            <SetMaxEvmBalance
              disabled={isRunningOperation}
              gas={depositGasFees}
              onSetMaxBalance={updateInput}
              token={pool.token}
            />
          }
        />
      }
      onSubmit={handleDeposit}
      submitButton={
        <SubmitDeposit
          canDeposit={canDeposit}
          isAllowanceError={isAllowanceError}
          isAllowanceLoading={isAllowanceLoading}
          isRunningOperation={isRunningOperation}
          needsApproval={needsApproval}
          operationRunning={operationRunning}
          validationError={validationError}
        />
      }
    />
  )
}
