'use client'

import { EvmFeesSummary } from 'components/evmFeesSummary'
import { FeesContainer } from 'components/feesContainer'
import { useHemi } from 'hooks/useHemi'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { StakingDashboardToken } from 'types/stakingDashboard'
import { walletIsConnected } from 'utils/wallet'
import { formatUnits } from 'viem'
import { useAccount as useEvmAccount } from 'wagmi'

import {
  StakingDashboardStake,
  TypedStakingDashboardState,
} from '../_hooks/useStakingDashboardState'

import { FormContent, StakingForm } from './form'
import { isValidLockup } from './lockup'
import { SubmitStake } from './submitStake'

const SetMaxEvmBalance = dynamic(
  () => import('components/setMaxBalance').then(mod => mod.SetMaxEvmBalance),
  { ssr: false },
)

type OperationRunning = 'idle' | 'staking'

type StakeProps = {
  state: TypedStakingDashboardState<StakingDashboardStake>
  token: StakingDashboardToken
}

export const Stake = function ({ state, token }: StakeProps) {
  const t = useTranslations()
  // use this to be able to show state boxes before user confirmation (mutation isn't finished)
  const [operationRunning, setOperationRunning] =
    useState<OperationRunning>('idle')

  const { lockupDays, updateInput } = state
  const { status } = useEvmAccount()
  const hemi = useHemi()

  // TODO(placeholder): Temporary mocked values for UI wiring only.
  // Replace once contract reads/writes and validations are wired up.
  const stakeGasFees = BigInt(0)
  const isStakeGasFeesError = false
  const isRunningOperation = false
  const canStake = false
  const validationError = undefined

  const getGas = () => ({
    amount: formatUnits(stakeGasFees, token.decimals),
    isError: isStakeGasFeesError,
    label: t('common.network-gas-fee', { network: hemi.name }),
    token,
  })

  // TODO - Placeholder for total stake, replace with actual logic
  const getTotalStake = () => '0'

  const handleStake = function () {
    // TODO - Placeholder for stake logic, replace with actual logic
    setOperationRunning('staking')
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
      canStake={isValidLockup(lockupDays)}
      isRunningOperation={isRunningOperation}
      operationRunning={operationRunning}
      token={token}
      validationError={validationError}
    />
  )

  return (
    <>
      <StakingForm
        belowForm={<RenderBelowForm />}
        formContent={
          <FormContent
            errorKey={walletIsConnected(status) ? 'errorKey' : undefined}
            isRunningOperation={isRunningOperation}
            setMaxBalanceButton={
              <SetMaxEvmBalance
                disabled={isRunningOperation}
                gas={stakeGasFees}
                onSetMaxBalance={maxBalance => updateInput(maxBalance)}
                token={token}
              />
            }
            stakingDashboardState={state}
            token={token}
          />
        }
        onSubmit={handleStake}
        submitButton={<RenderSubmitButton />}
      />
    </>
  )
}
