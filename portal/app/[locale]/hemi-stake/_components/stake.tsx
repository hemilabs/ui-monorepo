import { EvmFeesSummary } from 'components/evmFeesSummary'
import { FeesContainer } from 'components/feesContainer'
import { SetMaxEvmBalance } from 'components/setMaxBalance'
import { useHemiToken } from 'hooks/useHemiToken'

import { useStakingDashboard } from '../_context/stakingDashboardContext'
import { useStakeSubmission } from '../_hooks/useStakeSubmission'

import { FormContent, StakingForm } from './form'
import { SubmitStake } from './submitStake'

export const Stake = function () {
  const token = useHemiToken()

  const { autoRelock, input, lockupDays, updateInput } = useStakingDashboard()

  const {
    canStake,
    createLockGasFees,
    errorKey,
    gas,
    isAllowanceError,
    isAllowanceLoading,
    isRunningOperation,
    needsApproval,
    operationRunning,
    submit,
    validationError,
  } = useStakeSubmission({ autoRelock, input, lockupDays })

  function RenderBelowForm() {
    if (!canStake) return null
    return (
      <FeesContainer>
        <EvmFeesSummary gas={gas} />
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
          errorKey={errorKey}
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
      onSubmit={submit}
      submitButton={<RenderSubmitButton />}
    />
  )
}
