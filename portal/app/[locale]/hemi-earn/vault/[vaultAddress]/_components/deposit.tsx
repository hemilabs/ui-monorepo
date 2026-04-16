'use client'

import { EvmFeesSummary } from 'components/evmFeesSummary'
import { encodeDepositToken } from 'hemi-earn-actions/actions'
import { useTokenBalance } from 'hooks/useBalance'
import { useChain } from 'hooks/useChain'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { validateSubmit } from 'utils/validateSubmit'
import { walletIsConnected } from 'utils/wallet'
import { type Address, formatUnits } from 'viem'
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
      chainId: pool.token.chainId,
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

  const chain = useChain(pool.token.chainId)
  const nativeToken = getNativeToken(pool.token.chainId)

  function RenderBelowForm() {
    if (!canDeposit) {
      return null
    }
    return (
      <div className="px-4">
        <EvmFeesSummary
          gas={{
            amount: formatUnits(
              totalFees,
              chain?.nativeCurrency.decimals ?? 18,
            ),
            isError: isFeesError,
            label: t('common.network-gas-fee', { network: chain?.name ?? '' }),
            token: nativeToken,
          }}
          operationToken={nativeToken}
        />
      </div>
    )
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
