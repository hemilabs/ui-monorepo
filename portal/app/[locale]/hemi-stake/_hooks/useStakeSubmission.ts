import { useTokenBalance } from 'hooks/useBalance'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import { useState } from 'react'
import { StakingOperationRunning } from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { walletIsConnected } from 'utils/wallet'
import { getVeHemiContractAddress } from 've-hemi-actions'
import { type Address, formatUnits } from 'viem'
import { useAccount as useEvmAccount } from 'wagmi'

import { useStakingDashboard } from '../_context/stakingDashboardContext'
import { wholeDaysToSeconds } from '../_utils/lockCreationTimes'
import { getStakeValidation } from '../_utils/stakeValidation'

import { useEstimateCreateLockFees } from './useEstimateCreateLockFees'
import { useStake } from './useStake'

const useStakeGas = function ({
  amount,
  autoRelock,
  lockupDays,
  needsApproval,
  spender,
}: {
  amount: bigint
  autoRelock: boolean
  lockupDays: number
  needsApproval: boolean
  spender: Address
}) {
  const hemi = useHemi()
  const t = useTranslations()
  const token = useHemiToken()

  const { fees: approvalFees, isError: isApprovalFeesError } =
    useEstimateApproveErc20Fees({ amount, spender, token })

  const { fees: createLockGasFees, isError: isCreateLockFeesError } =
    useEstimateCreateLockFees({
      amount,
      autoRelock,
      lockDurationInSeconds: wholeDaysToSeconds(lockupDays),
      token,
    })

  return {
    createLockGasFees,
    gas: {
      amount: formatUnits(
        createLockGasFees + (needsApproval ? approvalFees : BigInt(0)),
        hemi.nativeCurrency.decimals,
      ),
      isError: isCreateLockFeesError || (needsApproval && isApprovalFeesError),
      label: t('common.network-gas-fee', { network: hemi.name }),
      token: getNativeToken(hemi.id),
    },
  }
}

export const useStakeSubmission = function ({
  autoRelock,
  input,
  lockupDays,
}: {
  autoRelock: boolean
  input: string
  lockupDays: number
}) {
  const token = useHemiToken()
  const t = useTranslations()
  // use this to be able to show state boxes before user confirmation (mutation isn't finished)
  const [operationRunning, setOperationRunning] =
    useState<Exclude<StakingOperationRunning, 'staked'>>('idle')

  const { resetStateAfterOperation, updateStakingDashboardOperation } =
    useStakingDashboard()

  const { status } = useEvmAccount()

  const amount = parseTokenUnits(input, token)
  const spender = getVeHemiContractAddress(token.chainId)

  const { isAllowanceError, isAllowanceLoading, needsApproval } =
    useNeedsApproval({
      address: token.address,
      amount,
      chainId: token.chainId,
      spender,
    })

  const balance = useTokenBalance(token.chainId, token.address)

  const { canStake, errorKey, validationError } = getStakeValidation({
    balance,
    input,
    lockupDays,
    t,
    token,
  })

  const { createLockGasFees, gas } = useStakeGas({
    amount,
    autoRelock,
    lockupDays,
    needsApproval,
    spender,
  })

  const { isPending: isRunningOperation, mutate: stake } = useStake({
    autoRelock,
    input,
    lockupDays,
    on(emitter) {
      emitter.on('approve-transaction-succeeded', () =>
        setOperationRunning('staking'),
      )
      emitter.on('lock-creation-transaction-succeeded', function () {
        resetStateAfterOperation()
      })
      emitter.on('lock-creation-settled', () => setOperationRunning('idle'))
    },
    token,
    updateStakingDashboardOperation,
  })

  const submit = function () {
    stake()
    if (needsApproval) {
      setOperationRunning('approving')
    } else {
      setOperationRunning('staking')
    }
  }

  return {
    canStake,
    createLockGasFees,
    errorKey:
      walletIsConnected(status) && balance.isSuccess ? errorKey : undefined,
    gas,
    isAllowanceError,
    isAllowanceLoading,
    isRunningOperation,
    needsApproval,
    operationRunning,
    submit,
    validationError,
  }
}
