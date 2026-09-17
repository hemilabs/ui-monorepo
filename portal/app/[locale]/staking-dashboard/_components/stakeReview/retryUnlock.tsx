import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useHemiToken } from 'hooks/useHemiToken'
import { type FormEvent, useState } from 'react'
import { type UnlockingOperationRunning } from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'

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
      // Every way the flow can stop. Missing one latches the control disabled for the
      // life of the page - the capture step fails on its own, and the two
      // `withdraw-failed*` events stop the burn with nothing ever signed.
      const failures = [
        'capture-position-class-failed',
        'capture-position-class-transaction-reverted',
        'unexpected-error',
        'user-signing-capture-position-class-error',
        'user-signing-withdraw-error',
        'withdraw-failed',
        'withdraw-failed-validation',
        'withdraw-transaction-reverted',
      ] as const
      failures.forEach(event =>
        emitter.on(event, () => setOperationRunning('failed')),
      )
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
    // `onError` as well as the emitter: the mutation can reject before the action even
    // exists (a declined chain switch, no account), leaving the control latched.
    runUnlock(undefined, { onError: () => setOperationRunning('failed') })
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
