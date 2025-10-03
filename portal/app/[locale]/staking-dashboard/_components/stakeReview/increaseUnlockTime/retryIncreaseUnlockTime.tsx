import { useIncreaseUnlockTime } from 'app/[locale]/staking-dashboard/_hooks/useIncreaseUnlockTime'
import { Button } from 'components/button'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'
import { type StakingOperationRunning } from 'types/stakingDashboard'

import { useStakingDashboard } from './../../../_context/stakingDashboardContext'

export const RetryIncreaseUnlockTime = function () {
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
