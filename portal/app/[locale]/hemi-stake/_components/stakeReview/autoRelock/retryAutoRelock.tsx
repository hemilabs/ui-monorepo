import { useToggleAutoRelock } from 'app/[locale]/hemi-stake/_hooks/useToggleAutoRelock'
import { Button } from 'components/button'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { type SubmitEvent, useState } from 'react'
import { type StakingOperationRunning } from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'

import { useStakingDashboard } from './../../../_context/stakingDashboardContext'

export const RetryAutoRelock = function () {
  const [operationRunning, setOperationRunning] =
    useState<StakingOperationRunning>('idle')

  const {
    resetStateAfterOperation,
    stakingDashboardOperation,
    updateStakingDashboardOperation,
  } = useStakingDashboard()

  const { autoRelock = false, stakingPosition } = stakingDashboardOperation!
  const { tokenId } = stakingPosition!

  const hemi = useHemi()
  const t = useTranslations()
  const token = useHemiToken()

  const { mutate: runToggle } = useToggleAutoRelock({
    enable: !autoRelock,
    on(emitter) {
      emitter.on('user-signed-auto-relock', () =>
        setOperationRunning('staking'),
      )
      emitter.on('auto-relock-transaction-succeeded', function () {
        resetStateAfterOperation()
      })
    },
    token,
    tokenId: tokenId!,
    updateStakingDashboardOperation,
  })

  const isRunning = operationRunning === 'staking'

  const handleRetry = function (e: SubmitEvent) {
    e.preventDefault()
    setOperationRunning('staking')
    runToggle(undefined, { onSettled: () => setOperationRunning('staked') })
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
