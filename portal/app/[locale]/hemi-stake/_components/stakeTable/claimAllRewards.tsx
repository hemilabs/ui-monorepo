import { Button } from 'components/button'
import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'components/tooltip'
import { useMemo } from 'react'
import { type StakingPosition } from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useClaimablePositions } from '../../_hooks/useClaimablePositions'
import { useCollectRewards } from '../../_hooks/useCollectAllRewards'
import { useRewardsPaused } from '../../_hooks/useRewardsPaused'

type Props = {
  positions: StakingPosition[] | undefined
}

export function ClaimAllRewards({ positions }: Props) {
  const t = useTranslations('hemi-stake.table')
  const isPaused = useRewardsPaused()
  const { updateCollectRewardsDashboardOperation } = useStakingDashboard()

  const tokenIds = useMemo(
    () => positions?.map(({ tokenId }) => tokenId) ?? [],
    [positions],
  )

  const { positions: claimablePositions } = useClaimablePositions(tokenIds)

  const { isPending: isCollecting, mutate: runCollectRewards } =
    useCollectRewards({
      tokenIds,
      updateCollectRewardsDashboardOperation,
    })

  const positionsWithRewards = claimablePositions.filter(
    ({ transactions }) => transactions.length > 0,
  )

  if (positionsWithRewards.length < 2) {
    return null
  }

  return (
    <Tooltip disabled={!isPaused} text={t('claiming-paused')} variant="simple">
      <Button
        disabled={isCollecting || isPaused}
        onClick={() => runCollectRewards()}
        size="xSmall"
      >
        <span className="flex items-center gap-x-1">
          {t('claim-all-rewards')}
          {isPaused ? <InfoIcon /> : null}
        </span>
      </Button>
    </Tooltip>
  )
}
