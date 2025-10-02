import { Button } from 'components/button'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'
import { type StakingOperationRunning } from 'types/stakingDashboard'

import { useStakingDashboard } from '../../../_context/stakingDashboardContext'
import { useIncreaseAmount } from '../../../_hooks/useIncreaseAmount'

export const RetryIncreaseAmount = function () {
  const [operationRunning, setOperationRunning] =
    useState<StakingOperationRunning>('idle')

  const {
    resetStateAfterOperation,
    stakingDashboardOperation,
    updateStakingDashboardOperation,
  } = useStakingDashboard()

  // stakingDashboardOperation and stakingPosition will always be defined here
  const { input, stakingPosition } = stakingDashboardOperation!
  const { tokenId } = stakingPosition!

  const token = useHemiToken()
  const hemi = useHemi()

  const t = useTranslations()

  // this component tries to initiate a new operation, based on the failed one
  const { mutate: runStake } = useIncreaseAmount({
    input: input!,
    on(emitter) {
      emitter.on('user-signed-approve', () => setOperationRunning('staking'))
      emitter.on('user-signed-increase-amount', () =>
        setOperationRunning('staking'),
      )
      emitter.on('increase-amount-transaction-succeeded', function () {
        resetStateAfterOperation()
      })
      emitter.on('increase-amount-settled', () => setOperationRunning('staked'))
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
