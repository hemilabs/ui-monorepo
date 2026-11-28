import { InRelativeTime } from 'components/inRelativeTime'
import { Tooltip } from 'components/tooltip'
import { useFormat } from 'hooks/useFormat'
import {
  StakingPositionStatus,
  type StakingPosition,
} from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'
import { snapToEpoch } from 've-hemi-actions'

import { getUnlockInfo } from '../../_utils/lockCreationTimes'

type Props = {
  autoRelock: boolean
  effectiveLockEnd: StakingPosition['effectiveLockEnd']
  lockTime: bigint
  status: StakingPosition['status']
}

export const LockupTime = function ({
  autoRelock,
  effectiveLockEnd,
  lockTime,
  status,
}: Props) {
  const { formatDate, formatDuration } = useFormat()
  const t = useTranslations('hemi-stake.table')
  const { currentTimeInSeconds, unlockDate, unlockTime } = getUnlockInfo({
    unlockTime: effectiveLockEnd,
  })

  return (
    <Tooltip
      text={t(autoRelock ? 'lockup-tooltip-auto-relock' : 'lockup-tooltip', {
        date: formatDate(unlockDate),
        duration: formatDuration(
          autoRelock
            ? unlockTime - snapToEpoch(currentTimeInSeconds)
            : Number(lockTime),
        ),
      })}
      variant="simple"
    >
      <div className="flex flex-col">
        <span className="text-neutral-950">{formatDate(unlockDate)}</span>
        {status === StakingPositionStatus.ACTIVE && (
          <span className="body-text-caption whitespace-nowrap text-neutral-500 first-letter:uppercase">
            <InRelativeTime timestamp={unlockTime} />
          </span>
        )}
      </div>
    </Tooltip>
  )
}
