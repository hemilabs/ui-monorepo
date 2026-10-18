import { useIncreaseUnlockTime } from 'app/[locale]/hemi-stake/_hooks/useIncreaseUnlockTime'
import { Button } from 'components/button'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { type FormEvent, useState } from 'react'
import { type StakingOperationRunning } from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'

import { useStakingDashboard } from './../../../_context/stakingDashboardContext'
import { isTransientLockFailure } from './../../../_utils/lockupValidationFailure'

export const RetryIncreaseUnlockTime = function ({
  onFailedValidation,
}: {
  onFailedValidation?: VoidFunction
}) {
  const [operationRunning, setOperationRunning] =
    useState<StakingOperationRunning>('idle')

  const {
    resetStateAfterOperation,
    stakingDashboardOperation,
    updateStakingDashboardOperation,
  } = useStakingDashboard()

  // stakingDashboardOperation and stakingPosition will always be defined here
  const { lockupDays, stakingPosition } = stakingDashboardOperation!
  const { tokenId } = stakingPosition!

  const token = useHemiToken()

  const hemi = useHemi()
  const t = useTranslations()

  // this component tries to initiate a new operation, based on the failed one
  const { mutate: runStake } = useIncreaseUnlockTime({
    lockupDays: lockupDays!,
    on(emitter) {
      emitter.on('user-signed-increase-unlock-time', () =>
        setOperationRunning('staking'),
      )
      emitter.on('increase-unlock-time-failed-validation', function (reason) {
        // Same stale-data case as the main form: refresh via the parent so the
        // retry does not loop forever, and re-enable this button (#2474). A lock
        // status that couldn't be read is a hiccup: the button just goes back to idle.
        if (!isTransientLockFailure(reason)) {
          onFailedValidation?.()
        }
        setOperationRunning('idle')
      })
      emitter.on('increase-unlock-time-transaction-succeeded', function () {
        resetStateAfterOperation()
      })
      emitter.on('increase-unlock-time-settled', () =>
        setOperationRunning('staked'),
      )
    },
    token,
    tokenId: tokenId!,
    updateStakingDashboardOperation,
  })

  const isStaking = operationRunning === 'staking'

  const handleRetry = function (e: FormEvent) {
    e.preventDefault()
    setOperationRunning('staking')
    runStake()
  }

  return (
    <form className="flex w-full [&>button]:w-full" onSubmit={handleRetry}>
      <SubmitWhenConnectedToChain
        chainId={hemi.id}
        submitButton={
          <Button disabled={isStaking} size="small">
            {t(isStaking ? 'hemi-stake.form.staking' : 'common.try-again')}
          </Button>
        }
        submitButtonSize="small"
      />
    </form>
  )
}
