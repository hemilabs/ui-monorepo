import { formatDuration } from 'components/durationTime'
import { InRelativeTime } from 'components/inRelativeTime'
import { Tooltip } from 'components/tooltip'
import { useLocale, useTranslations } from 'use-intl'
import { formatDate } from 'utils/format'

import { getUnlockInfo } from '../../_utils/lockCreationTimes'

type Props = {
  lockTime: bigint
  timestamp: bigint
}

export const LockupTime = function ({ lockTime, timestamp }: Props) {
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
        <span className="body-text-caption whitespace-nowrap text-neutral-500 first-letter:uppercase">
          <InRelativeTime timestamp={unlockTime} />
        </span>
      </div>
    </Tooltip>
  )
}
