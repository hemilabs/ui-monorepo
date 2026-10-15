import { useToggleAutoRelock } from 'app/[locale]/hemi-stake/_hooks/useToggleAutoRelock'
import { Button } from 'components/button'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useHemi } from 'hooks/useHemi'
import { type SubmitEvent, useState } from 'react'
import { type StakingOperationRunning } from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'

import { useStakingDashboard } from './../../../_context/stakingDashboardContext'

export const RetryAutoRelock = function () {
  const [operationRunning, setOperationRunning] =
    useState<StakingOperationRunning>('idle')

  const { resetStateAfterOperation, updateStakingDashboardOperation } =
    useStakingDashboard()

  const hemi = useHemi()
  const t = useTranslations()

  const { mutate: runToggle } = useToggleAutoRelock({
    onSettled: () => setOperationRunning('staked'),
    onSigned: () => setOperationRunning('staking'),
    onSucceeded: resetStateAfterOperation,
    updateStakingDashboardOperation,
  })

  const isRunning = operationRunning === 'staking'

  const handleRetry = function (e: SubmitEvent) {
    e.preventDefault()
    setOperationRunning('staking')
    runToggle()
  }

  return (
    <form className="flex w-full [&>button]:w-full" onSubmit={handleRetry}>
      <SubmitWhenConnectedToChain
        chainId={hemi.id}
        submitButton={
          <Button disabled={isRunning} size="small">
            {t(isRunning ? 'hemi-stake.form.staking' : 'common.try-again')}
          </Button>
        }
        submitButtonSize="small"
      />
    </form>
  )
}
