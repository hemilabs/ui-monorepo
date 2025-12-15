import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'
import { type UnlockingOperationRunning } from 'types/stakingDashboard'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useUnlock } from '../../_hooks/useUnlock'

export const RetryUnlock = function () {
  const [operationRunning, setOperationRunning] =
    useState<UnlockingOperationRunning>('idle')

  const { unlockingDashboardOperation, updateUnlockingDashboardOperation } =
    useStakingDashboard()

  const token = useHemiToken()

  const t = useTranslations()

  // unlockingDashboardOperation is defined because this component is only rendered in that case
  const { amount, tokenId } = unlockingDashboardOperation!.stakingPosition!

  // this component tries to initiate a new withdraw, based on the failed one
  const { mutate: runUnlock } = useUnlock({
    amount,
    on(emitter) {
      emitter.on('withdraw-transaction-reverted', () =>
        setOperationRunning('failed'),
      )
      emitter.on('user-signing-withdraw-error', () =>
        setOperationRunning('failed'),
      )
      emitter.on('unexpected-error', () => setOperationRunning('failed'))
      emitter.on('withdraw-transaction-succeeded', function () {
        setOperationRunning('idle')
      })
    },
    token,
    tokenId,
    updateUnlockingDashboardOperation,
  })

  const isUnlocking = operationRunning === 'unlocking'

  const handleRetry = function (e: FormEvent) {
    e.preventDefault()
    setOperationRunning('unlocking')
    runUnlock()
  }

  return (
    <form className="flex w-full [&>button]:w-full" onSubmit={handleRetry}>
      <SubmitWhenConnected
        submitButton={
          <Button disabled={isUnlocking} size="small">
            {t(
              isUnlocking
                ? 'staking-dashboard.form.unlocking'
                : 'common.try-again',
            )}
          </Button>
        }
        submitButtonSize="small"
      />
    </form>
  )
}
