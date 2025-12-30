import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'
import { type StakingOperationRunning } from 'types/stakingDashboard'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useStake } from '../../_hooks/useStake'

export const RetryStake = function () {
  const [operationRunning, setOperationRunning] =
    useState<Exclude<StakingOperationRunning, 'staked'>>('idle')

  const {
    input,
    lockupDays,
    resetStateAfterOperation,
    updateStakingDashboardOperation,
  } = useStakingDashboard()

  const token = useHemiToken()

  const t = useTranslations()

  // this component tries to initiate a new stake, based on the failed one
  const { mutate: runStake } = useStake({
    input,
    lockupDays,
    on(emitter) {
      emitter.on('approve-transaction-reverted', () =>
        setOperationRunning('failed'),
      )
      emitter.on('lock-creation-transaction-reverted', () =>
        setOperationRunning('failed'),
      )
      emitter.on('user-signing-approve-error', () =>
        setOperationRunning('failed'),
      )
      emitter.on('user-signing-lock-creation-error', () =>
        setOperationRunning('failed'),
      )
      emitter.on('unexpected-error', () => setOperationRunning('failed'))
      emitter.on('lock-creation-transaction-succeeded', function () {
        setOperationRunning('idle')
        resetStateAfterOperation()
      })
    },
    token,
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
      <SubmitWhenConnected
        submitButton={
          <Button disabled={isStaking} size="small">
            {t(
              isStaking ? 'staking-dashboard.form.staking' : 'common.try-again',
            )}
          </Button>
        }
        submitButtonSize="small"
      />
    </form>
  )
}
