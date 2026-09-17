import { Badge } from 'components/badge'
import { Button } from 'components/button'
import { InRelativeTime } from 'components/inRelativeTime'
import { Tooltip } from 'components/tooltip'
import { StakingPosition, StakingPositionStatus } from 'types/stakingDashboard'
import { useLocale, useTranslations } from 'use-intl'
import { formatDate } from 'utils/format'
import { useAccount } from 'wagmi'

import { getUnlockInfo } from '../../_utils/lockCreationTimes'
import { isPositionOwner } from '../../_utils/positionOwnership'

import { Unlock } from './unlock'

type Props = {
  operation: StakingPosition
}

export function UnlockCta({ operation }: Props) {
  const t = useTranslations('staking-dashboard.table')
  const locale = useLocale()

  const { address } = useAccount()
  const { amount, lockTime, owner, status, timestamp, tokenId } = operation

  const { timeRemainingSeconds, unlockDate, unlockTime } = getUnlockInfo({
    lockTime,
    timestamp,
  })

  // Ownership is checked after the terminal state: a burned position is burned whoever
  // holds it, and checking first offered a sold-and-burned one a disabled "Unlock".
  if (status === StakingPositionStatus.WITHDRAWN) {
    return (
      <Unlock operation={{ amount, status, tokenId }} unlockDate={unlockDate} />
    )
  }

  // A sold position still appears in the table, since it may still be owed rewards, but
  // only the current owner can unlock it. Say so instead of offering it.
  if (!isPositionOwner({ address, owner })) {
    return (
      <Tooltip text={t('not-position-owner')} variant="simple">
        <Button disabled size="xxSmall">
          {t('unlock')}
        </Button>
      </Tooltip>
    )
  }

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
