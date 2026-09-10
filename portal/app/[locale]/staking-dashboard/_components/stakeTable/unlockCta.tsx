import { Badge } from 'components/badge'
import { Button } from 'components/button'
import { InRelativeTime } from 'components/inRelativeTime'
import { Tooltip } from 'components/tooltip'
import { StakingPosition } from 'types/stakingDashboard'
import { useLocale, useTranslations } from 'use-intl'
import { formatDate } from 'utils/format'

import { getUnlockInfo } from '../../_utils/lockCreationTimes'

import { Unlock } from './unlock'

type Props = {
  operation: StakingPosition
}

export function UnlockCta({ operation }: Props) {
  const t = useTranslations('staking-dashboard.table')
  const locale = useLocale()

  const { amount, lockTime, status, timestamp, tokenId } = operation

  const { timeRemainingSeconds, unlockDate, unlockTime } = getUnlockInfo({
    lockTime,
    timestamp,
  })

  // While the position is still locked, show a disabled Unlock CTA with a badge
  // holding the time remaining until it can be withdrawn.
  if (timeRemainingSeconds > 0) {
    return (
      <Tooltip
        text={t('unlocks-on', { date: formatDate(unlockDate, locale) })}
        variant="simple"
      >
        <Button disabled size="xxSmall">
          <span className="flex items-center gap-x-1.5">
            {t('unlock')}
            <Badge>
              <span className="first-letter:uppercase">
                <InRelativeTime timestamp={unlockTime} />
              </span>
            </Badge>
          </span>
        </Button>
      </Tooltip>
    )
  }

  return (
    <Unlock operation={{ amount, status, tokenId }} unlockDate={unlockDate} />
  )
}
