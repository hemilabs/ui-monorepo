import { Button } from 'components/button'
import { InRelativeTime } from 'components/inRelativeTime'
import { Tooltip } from 'components/tooltip'
import { useLocale, useTranslations } from 'next-intl'
import { StakingPosition } from 'types/stakingDashboard'
import { formatDate } from 'utils/format'

import { CircularProgress } from './circularProgress'

type Props = {
  operation: StakingPosition
}

export function TimeRemaining({ operation }: Props) {
  const t = useTranslations('staking-dashboard')
  const locale = useLocale()

  const totalLockTimeSeconds = Number(operation.lockTime)
  const currentTimeInSeconds = Math.floor(Date.now() / 1000)
  const unlockTime = Number(operation.timestamp) + totalLockTimeSeconds
  const timeRemainingSeconds = unlockTime - currentTimeInSeconds

  // Calculate unlock date in UTC
  const unlockDate = new Date(unlockTime * 1000)

  // If time remaining is negative or zero, position can be unlocked
  if (timeRemainingSeconds <= 0) {
    return (
      <Button
        size="small"
        //TODO - unlock TBD
      >
        {t('table.unlock')}
      </Button>
    )
  }

  // Calculate percentage of time that has passed
  const timePassedSeconds = currentTimeInSeconds - Number(operation.timestamp)
  const percentagePassed = Math.min(
    100,
    Math.max(0, (timePassedSeconds / totalLockTimeSeconds) * 100),
  )

  return (
    <Tooltip
      overlay={
        <p className="p-2 text-sm font-medium text-white">
          {t('table.unlocks-on', {
            date: formatDate(unlockDate, locale),
          })}
        </p>
      }
    >
      <div className="flex w-full items-center gap-x-3">
        <CircularProgress percentage={percentagePassed} />
        <span className="text-left text-neutral-950">
          <InRelativeTime timestamp={unlockTime} />
        </span>
      </div>
    </Tooltip>
  )
}
