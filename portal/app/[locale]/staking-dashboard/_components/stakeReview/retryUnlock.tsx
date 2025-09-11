import { Button } from 'components/button'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useUnlock } from '../../_hooks/useUnlock'
import { OperationRunning } from '../stakeTable/unlock'

export const RetryUnlock = function () {
  const [operationRunning, setOperationRunning] =
    useState<OperationRunning>('idle')

  const { unlockingDashboardOperation, updateUnlockingDashboardOperation } =
    useStakingDashboard()

  const token = useHemiToken()
  const hemi = useHemi()

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
      <SubmitWhenConnectedToChain
        chainId={hemi.id}
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
