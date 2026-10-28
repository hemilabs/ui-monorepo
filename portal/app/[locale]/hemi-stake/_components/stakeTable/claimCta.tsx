import { Button } from 'components/button'
import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'components/tooltip'
import { type StakingPosition } from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import {
  useCollectRewards,
  useIsCollectingRewards,
} from '../../_hooks/useCollectAllRewards'
import { useDrawerStakingQueryString } from '../../_hooks/useDrawerStakingQueryString'
import { useHasRewards } from '../../_hooks/useHasRewards'
import { useRewardsPaused } from '../../_hooks/useRewardsPaused'

type Props = {
  operation: Pick<StakingPosition, 'tokenId'>
}

export function ClaimCta({ operation }: Props) {
  const t = useTranslations('hemi-stake.table')
  const { tokenId } = operation
  const { hasRewards } = useHasRewards(tokenId)
  const isPaused = useRewardsPaused()
  const {
    collectRewardsDashboardOperation,
    updateCollectRewardsDashboardOperation,
  } = useStakingDashboard()
  const { setDrawerQueryString } = useDrawerStakingQueryString()
  const isCollecting = useIsCollectingRewards()

  const { mutate: runCollectRewards } = useCollectRewards({
    tokenIds: [tokenId],
    updateCollectRewardsDashboardOperation,
  })

  if (!hasRewards) {
    return null
  }

  const isInRun =
    isCollecting &&
    (collectRewardsDashboardOperation?.steps ?? []).some(
      step => step.tokenId === tokenId,
    )

  const handleClick = function () {
    if (isInRun) {
      setDrawerQueryString('claimingRewards')
      return
    }
    runCollectRewards()
  }

  const showPaused = isPaused && !isCollecting

  return (
    <Tooltip
      disabled={!showPaused}
      text={t('claiming-paused')}
      variant="simple"
    >
      <Button
        disabled={showPaused || (isCollecting && !isInRun)}
        onClick={handleClick}
        size="xxSmall"
        variant="secondary"
      >
        <span className="flex items-center gap-x-1">
          {t(isInRun ? 'claiming' : 'claim')}
          {showPaused ? <InfoIcon /> : null}
        </span>
      </Button>
    </Tooltip>
  )
}
