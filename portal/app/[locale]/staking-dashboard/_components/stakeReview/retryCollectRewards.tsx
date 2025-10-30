import { Button } from 'components/button'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'
import { CollectAllRewardsOperationRunning } from 'types/stakingDashboard'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useCollectRewards } from '../../_hooks/useCollectAllRewards'

export const RetryCollectRewards = function () {
  const [operationRunning, setOperationRunning] =
    useState<CollectAllRewardsOperationRunning>('idle')

  const {
    collectRewardsDashboardOperation,
    updateCollectRewardsDashboardOperation,
  } = useStakingDashboard()

  const hemi = useHemi()
  const t = useTranslations()

  // collectRewardsDashboardOperation is defined because this component is only rendered in that case
  const { stakingPosition } = collectRewardsDashboardOperation!

  // this component tries to initiate a new collect rewards, based on the failed one
  const { mutate: runCollectRewards } = useCollectRewards({
    on(emitter) {
      emitter.on('user-signing-collect-all-rewards-error', function () {
        setOperationRunning('failed')
      })
      emitter.on('collect-all-rewards-transaction-succeeded', function () {
        setOperationRunning('idle')
      })
      emitter.on('collect-all-rewards-transaction-reverted', function () {
        setOperationRunning('failed')
      })
      emitter.on('unexpected-error', () => setOperationRunning('failed'))
    },
    tokenId: stakingPosition!.tokenId,
    updateCollectRewardsDashboardOperation,
  })

  const isCollecting = operationRunning === 'collecting'

  const handleRetry = function (e: FormEvent) {
    e.preventDefault()
    setOperationRunning('collecting')
    runCollectRewards()
  }

  return (
    <form className="flex w-full [&>button]:w-full" onSubmit={handleRetry}>
      <SubmitWhenConnectedToChain
        chainId={hemi.id}
        submitButton={
          <Button disabled={isCollecting} size="small">
            {t(
              isCollecting
                ? 'staking-dashboard.claim-rewards.heading'
                : 'common.try-again',
            )}
          </Button>
        }
        submitButtonSize="small"
      />
    </form>
  )
}
