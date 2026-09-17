import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { type FormEvent } from 'react'
import { useTranslations } from 'use-intl'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useCollectRewards } from '../../_hooks/useCollectAllRewards'
import { useRewardsPaused } from '../../_hooks/useRewardsPaused'

export const RetryCollectRewards = function () {
  const {
    collectRewardsDashboardOperation,
    updateCollectRewardsDashboardOperation,
  } = useStakingDashboard()

  const t = useTranslations()

  // collectRewardsDashboardOperation is defined because this component is only rendered in that case
  const { stakingPosition } = collectRewardsDashboardOperation!

  const isPaused = useRewardsPaused()

  const { isPending: isCollecting, mutate: runCollectRewards } =
    useCollectRewards({
      tokenId: stakingPosition!.tokenId,
      updateCollectRewardsDashboardOperation,
    })

  const handleRetry = function (e: FormEvent) {
    e.preventDefault()
    runCollectRewards()
  }

  return (
    <form className="flex w-full [&>button]:w-full" onSubmit={handleRetry}>
      <SubmitWhenConnected
        submitButton={
          <Button disabled={isCollecting || isPaused} size="small">
            {t(
              isCollecting
                ? 'hemi-stake.claim-rewards.heading'
                : 'common.try-again',
            )}
          </Button>
        }
        submitButtonSize="small"
      />
    </form>
  )
}
