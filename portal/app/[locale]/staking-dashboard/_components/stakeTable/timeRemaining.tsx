import { Tooltip } from 'components/tooltip'
import { useLocale, useTranslations } from 'next-intl'
import { StakingPosition } from 'types/stakingDashboard'
import { formatDate } from 'utils/format'

import { LinearProgress } from './linearProgress'
import { Unlock } from './unlock'

type Props = {
  operation: StakingPosition
}

export function TimeRemaining({ operation }: Props) {
  const t = useTranslations('staking-dashboard')
  const locale = useLocale()

  const { amount, lockTime, status, timestamp, tokenId } = operation

  const totalLockTimeSeconds = Number(lockTime)
  const currentTimeInSeconds = Math.floor(Date.now() / 1000)
  const unlockTime = Number(timestamp) + totalLockTimeSeconds
  const timeRemainingSeconds = unlockTime - currentTimeInSeconds

  // Calculate unlock date in UTC
  const unlockDate = new Date(unlockTime * 1000)

  // If time remaining is negative or zero, position can be unlocked
  if (timeRemainingSeconds <= 0) {
    return (
      <Unlock
        operation={{
          amount,
          status,
          tokenId,
        }}
      />
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
      <LinearProgress percentage={percentagePassed} unlockTime={unlockTime} />
    </Tooltip>
  )
}
