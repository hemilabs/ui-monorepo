import { Button } from 'components/button'
import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'components/tooltip'
import { type StakingPosition } from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useCollectRewards } from '../../_hooks/useCollectAllRewards'
import { useHasRewards } from '../../_hooks/useHasRewards'
import { useRewardsPaused } from '../../_hooks/useRewardsPaused'

type Props = {
  operation: Pick<StakingPosition, 'amount' | 'tokenId'>
}

export function ClaimCta({ operation }: Props) {
  const t = useTranslations('hemi-stake.table')
  const { amount, tokenId } = operation
  const { hasRewards } = useHasRewards(tokenId)
  const isPaused = useRewardsPaused()
  const { updateCollectRewardsDashboardOperation } = useStakingDashboard()

  const { isPending: isCollecting, mutate: runCollectRewards } =
    useCollectRewards({
      tokenId,
      updateCollectRewardsDashboardOperation,
    })

  if (!hasRewards) {
    return null
  }

  const handleClaim = function () {
    updateCollectRewardsDashboardOperation({
      stakingPosition: { amount, tokenId },
    })
    runCollectRewards()
  }

  return (
    <Tooltip disabled={!isPaused} text={t('claiming-paused')} variant="simple">
      <Button
        disabled={isCollecting || isPaused}
        onClick={handleClaim}
        size="xxSmall"
        variant="secondary"
      >
        <span className="flex items-center gap-x-1">
          {t('claim')}
          {isPaused ? <InfoIcon /> : null}
        </span>
      </Button>
    </Tooltip>
  )
}
