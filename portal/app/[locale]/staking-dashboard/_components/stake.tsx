'use client'

import { EvmFeesSummary } from 'components/evmFeesSummary'
import { FeesContainer } from 'components/feesContainer'
import { useTokenBalance } from 'hooks/useBalance'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { StakingOperationRunning } from 'types/stakingDashboard'
import { getTotal } from 'utils/getTotal'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { validateSubmit } from 'utils/validateSubmit'
import { walletIsConnected } from 'utils/wallet'
import { getVeHemiContractAddress } from 've-hemi-actions'
import { formatUnits } from 'viem'
import { useAccount as useEvmAccount } from 'wagmi'

import { useStakingDashboard } from '../_context/stakingDashboardContext'
import { useEstimateCreateLockFees } from '../_hooks/useEstimateCreateLockFees'
import { useStake } from '../_hooks/useStake'
import { daysToSeconds } from '../_utils/lockCreationTimes'

import { FormContent, StakingForm } from './form'
import { isValidLockup } from './lockup'
import { SubmitStake } from './submitStake'

const SetMaxEvmBalance = dynamic(
  () => import('components/setMaxBalance').then(mod => mod.SetMaxEvmBalance),
  { ssr: false },
)

export const Stake = function () {
  const token = useHemiToken()
  const t = useTranslations()
  // use this to be able to show state boxes before user confirmation (mutation isn't finished)
  const [operationRunning, setOperationRunning] =
    useState<Exclude<StakingOperationRunning, 'staked'>>('idle')

  const {
    input,
    lockupDays,
    resetStateAfterOperation,
    updateInput,
    updateStakingDashboardOperation,
  } = useStakingDashboard()

  const { status } = useEvmAccount()
  const hemi = useHemi()

  const amount = parseTokenUnits(input, token)

  const veHemiAddress = getVeHemiContractAddress(token.chainId)

  const { isAllowanceError, isAllowanceLoading, needsApproval } =
    useNeedsApproval({
      address: token.address,
      amount,
      spender: veHemiAddress,
    })

  const { balance: walletTokenBalance, isSuccess: tokenBalanceLoaded } =
    useTokenBalance(token.chainId, token.address)

  const {
    canSubmit: validInput,
    error: validationError,
    errorKey,
  } = validateSubmit({
    amountInput: input,
    balance: walletTokenBalance,
    operation: 'stake',
    t,
    token,
  })

  const canStake = validInput && isValidLockup({ value: lockupDays })

  const { fees: approvalTokenGasFees, isError: isApprovalTokenGasFeesError } =
    useEstimateApproveErc20Fees({
      amount,
      spender: veHemiAddress,
      token,
    })

  const { fees: createLockGasFees, isError: isCreateLockFeesError } =
    useEstimateCreateLockFees({
      amount,
      lockDurationInSeconds: BigInt(daysToSeconds(lockupDays)),
      token,
    })

  const getGas = () => ({
    amount: formatUnits(
      createLockGasFees + (needsApproval ? approvalTokenGasFees : BigInt(0)),
      hemi.nativeCurrency.decimals,
    ),
    isError:
      isCreateLockFeesError || (needsApproval && isApprovalTokenGasFeesError),
    label: t('common.network-gas-fee', { network: hemi.name }),
    token: getNativeToken(hemi.id),
  })

  const getTotalStake = () =>
    getTotal({
      fees: createLockGasFees,
      fromInput: input,
      fromToken: token,
    })

  const { isPending: isRunningOperation, mutate: stake } = useStake({
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

  const handleStake = function () {
    stake()
    if (needsApproval) {
      setOperationRunning('approving')
    } else {
      setOperationRunning('staking')
    }
  }

  function RenderBelowForm() {
    if (!canStake) return null

    return (
      <FeesContainer>
        <EvmFeesSummary
          gas={getGas()}
          operationToken={token}
          total={getTotalStake()}
        />
      </FeesContainer>
    )
  }

  const RenderSubmitButton = () => (
    <SubmitStake
      canStake={canStake}
      isAllowanceError={isAllowanceError}
      isAllowanceLoading={isAllowanceLoading}
      isRunningOperation={isRunningOperation}
      needsApproval={needsApproval}
      operationRunning={operationRunning}
      token={token}
      validationError={validationError}
    />
  )

  return (
    <StakingForm
      belowForm={<RenderBelowForm />}
      formContent={
        <FormContent
          errorKey={
            walletIsConnected(status) && tokenBalanceLoaded
              ? errorKey
              : undefined
          }
          isRunningOperation={isRunningOperation}
          setMaxBalanceButton={
            <SetMaxEvmBalance
              disabled={isRunningOperation}
              gas={createLockGasFees}
              onSetMaxBalance={updateInput}
              token={token}
            />
          }
        />
      }
      onSubmit={handleStake}
      submitButton={<RenderSubmitButton />}
    />
  )
}
