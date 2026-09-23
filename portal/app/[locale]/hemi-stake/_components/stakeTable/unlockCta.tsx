import { Button } from 'components/button'
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
  const t = useTranslations('hemi-stake.table')
  const locale = useLocale()

  const { amount, lockTime, status, timestamp, tokenId } = operation

  const { timeRemainingSeconds, unlockDate } = getUnlockInfo({
    lockTime,
    timestamp,
  })

  if (timeRemainingSeconds > 0) {
    return (
      <Tooltip
        text={t('unlocks-on', { date: formatDate(unlockDate, locale) })}
        variant="simple"
      >
        <Button disabled size="xxSmall">
          {t('unlock')}
        </Button>
      </Tooltip>
    )
  }

  return (
    <Unlock operation={{ amount, status, tokenId }} unlockDate={unlockDate} />
  )
}
