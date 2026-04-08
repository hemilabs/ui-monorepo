'use client'

import { HemiFees } from 'components/hemiFees'
import { encodeWithdraw } from 'hemi-earn-actions/actions'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { parseTokenUnits } from 'utils/token'
import { validateSubmit } from 'utils/validateSubmit'
import { walletIsConnected } from 'utils/wallet'
import { type Address } from 'viem'
import { useAccount as useEvmAccount, useEstimateGas } from 'wagmi'

import { useVaultForm } from '../_context/vaultFormContext'
import { useConvertToShares } from '../_hooks/useConvertToShares'
import { useUserVaultBalance } from '../_hooks/useUserVaultBalance'
import { useWithdraw } from '../_hooks/useWithdraw'
import { type VaultWithdrawOperationRunning } from '../_types/vaultOperations'

import { VaultFormLayout } from './form'
import { SubmitWithdraw } from './submitWithdraw'
import { UserVaultBalance } from './userVaultBalance'
import { VaultFormContent } from './vaultFormContent'
import { WithdrawMaxBalance } from './withdrawMaxBalance'

type Props = {
  onSwitchToDeposit: VoidFunction
}

export const Withdraw = function ({ onSwitchToDeposit }: Props) {
  const t = useTranslations()
  const [operationRunning, setOperationRunning] =
    useState<VaultWithdrawOperationRunning>('idle')

  const {
    input,
    pool,
    resetStateAfterOperation,
    updateInput,
    updateWithdrawOperation,
  } = useVaultForm()

  const { address, status } = useEvmAccount()
  const hemi = useHemi()

  const amount = parseTokenUnits(input, pool.token)

  const { data: vaultBalance, isSuccess: vaultBalanceLoaded } =
    useUserVaultBalance(pool.vaultAddress)

  const {
    canSubmit: validInput,
    error: validationError,
    errorKey,
  } = validateSubmit({
    amountInput: input,
    balance: vaultBalance,
    operation: 'withdrawal',
    t,
    token: pool.token,
  })

  const canWithdraw = validInput

  const { data: shares } = useConvertToShares({
    assets: amount,
    enabled: canWithdraw,
    vaultAddress: pool.vaultAddress,
  })

  const { data: withdrawGasUnits, isError: isWithdrawGasUnitsError } =
    useEstimateGas({
      data:
        canWithdraw && address && shares !== undefined
          ? encodeWithdraw({
              owner: address,
              receiver: address,
              shares,
            })
          : undefined,
      query: { enabled: canWithdraw && !!address && shares !== undefined },
      to: pool.vaultAddress as Address,
    })

  const { fees: withdrawGasFees, isError: isWithdrawGasFeesError } =
    useEstimateFees({
      chainId: hemi.id,
      gasUnits: withdrawGasUnits,
      isGasUnitsError: isWithdrawGasUnitsError,
      overEstimation: 1.5,
    })

  const { isPending: isRunningOperation, mutate: withdrawFn } = useWithdraw({
    input,
    on(emitter) {
      emitter.on('withdraw-transaction-succeeded', function () {
        resetStateAfterOperation()
      })
      emitter.on('withdraw-settled', () => setOperationRunning('idle'))
    },
    pool,
    updateWithdrawOperation,
  })

  const handleWithdraw = function () {
    withdrawFn(undefined, {
      onError: () => setOperationRunning('idle'),
    })
    setOperationRunning('withdrawing')
  }

  function RenderBelowForm() {
    if (!canWithdraw) {
      return null
    }
    return <HemiFees fees={withdrawGasFees} isError={isWithdrawGasFeesError} />
  }

  return (
    <VaultFormLayout
      belowForm={<RenderBelowForm />}
      formContent={
        <VaultFormContent
          activeTab="withdraw"
          balanceComponent={UserVaultBalance}
          errorKey={
            walletIsConnected(status) && vaultBalanceLoaded
              ? errorKey
              : undefined
          }
          isRunningOperation={isRunningOperation}
          onSwitchTab={onSwitchToDeposit}
          setMaxBalanceButton={
            <WithdrawMaxBalance
              disabled={isRunningOperation}
              onSetMaxBalance={updateInput}
              token={pool.token}
            />
          }
        />
      }
      onSubmit={handleWithdraw}
      submitButton={
        <SubmitWithdraw
          canWithdraw={canWithdraw}
          isRunningOperation={isRunningOperation}
          operationRunning={operationRunning}
          validationError={validationError}
        />
      }
    />
  )
}
