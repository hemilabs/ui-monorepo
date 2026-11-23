import { InRelativeTime } from 'components/inRelativeTime'
import { Tooltip } from 'components/tooltip'
import { useFormat } from 'hooks/useFormat'
import {
  StakingPositionStatus,
  type StakingPosition,
} from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'

import { getUnlockInfo } from '../../_utils/lockCreationTimes'

type Props = {
  lockTime: bigint
  status: StakingPosition['status']
  timestamp: bigint
}

export const LockupTime = function ({ lockTime, status, timestamp }: Props) {
  const { formatDate, formatDuration } = useFormat()
  const t = useTranslations('hemi-stake.table')
  const { unlockDate, unlockTime } = getUnlockInfo({ lockTime, timestamp })

  return (
    <Tooltip
      text={t('lockup-tooltip', {
        date: formatDate(unlockDate),
        duration: formatDuration(Number(lockTime)),
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
