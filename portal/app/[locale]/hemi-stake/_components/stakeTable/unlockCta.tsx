import { Button } from 'components/button'
import { Tooltip } from 'components/tooltip'
import { useFormat } from 'hooks/useFormat'
import { StakingPosition } from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'

import { getUnlockInfo } from '../../_utils/lockCreationTimes'

import { Unlock } from './unlock'

type Props = {
  operation: StakingPosition
}

export function UnlockCta({ operation }: Props) {
  const t = useTranslations('hemi-stake.table')
  const { formatDate } = useFormat()

  const { amount, lockTime, status, timestamp, tokenId } = operation

  const { timeRemainingSeconds, unlockDate } = getUnlockInfo({
    lockTime,
    timestamp,
  })

  if (timeRemainingSeconds > 0) {
    return (
      <Tooltip
        text={t('unlocks-on', { date: formatDate(unlockDate) })}
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
