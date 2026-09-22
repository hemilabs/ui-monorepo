import { InRelativeTime } from 'components/inRelativeTime'
import { Tooltip } from 'components/tooltip'
import {
  StakingPositionStatus,
  type StakingPosition,
} from 'types/stakingDashboard'
import { useLocale, useTranslations } from 'use-intl'
import { formatDuration } from 'utils/duration'
import { formatDate } from 'utils/format'

import { getUnlockInfo } from '../../_utils/lockCreationTimes'

type Props = {
  lockTime: bigint
  status: StakingPosition['status']
  timestamp: bigint
}

export const LockupTime = function ({ lockTime, status, timestamp }: Props) {
  const locale = useLocale()
  const t = useTranslations('hemi-stake.table')
  const { unlockDate, unlockTime } = getUnlockInfo({ lockTime, timestamp })

  return (
    <Tooltip
      text={t('lockup-tooltip', {
        date: formatDate(unlockDate, locale),
        duration: formatDuration(Number(lockTime), locale),
      })}
      variant="simple"
    >
      <div className="flex flex-col">
        <span className="text-neutral-950">
          {formatDate(unlockDate, locale)}
        </span>
        {status === StakingPositionStatus.ACTIVE && (
          <span className="body-text-caption whitespace-nowrap text-neutral-500 first-letter:uppercase">
            <InRelativeTime timestamp={unlockTime} />
          </span>
        )}
      </div>
    </Tooltip>
  )
}
