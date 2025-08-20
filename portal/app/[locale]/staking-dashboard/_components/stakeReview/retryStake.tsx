import { useHemiToken } from 'app/[locale]/genesis-drop/_hooks/useHemiToken'
import { Button } from 'components/button'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useStake } from '../../_hooks/useStake'

type OperationRunning = 'idle' | 'staking' | 'failed'

export const RetryStake = function () {
  const [operationRunning, setOperationRunning] =
    useState<OperationRunning>('idle')

  const {
    input,
    lockupDays,
    resetStateAfterOperation,
    updateStakingDashboardOperation,
  } = useStakingDashboard()

  const token = useHemiToken()
  const hemi = useHemi()

  const t = useTranslations('staking-dashboard')

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
      emitter.on('lock-creation-transaction-succeeded', function () {
        resetStateAfterOperation()
      })

      emitter.on('lock-creation-settled', () => setOperationRunning('idle'))
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
      <SubmitWhenConnectedToChain
        chainId={hemi.id}
        submitButton={
          <Button disabled={isStaking} size="small">
            {t(isStaking ? 'form.staking' : 'drawer.try-again')}
          </Button>
        }
        submitButtonSize="small"
      />
    </form>
  )
}
