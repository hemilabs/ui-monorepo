import { WarningIcon } from 'components/icons/warningIcon'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { secondsToWholeDays } from 'utils/time'
import { type Address } from 'viem'

import { useCooldownDuration } from '../../../_hooks/useCooldownDuration'

type Props = {
  shareAddress: Address
}

export const CooldownWarning = function ({ shareAddress }: Props) {
  const t = useTranslations()
  const { data: durationSec, isPending: isLoading } = useCooldownDuration({
    shareAddress,
  })
  const days =
    durationSec !== undefined ? secondsToWholeDays(durationSec) : undefined
  return (
    <div className="flex items-center gap-x-1 rounded-lg bg-neutral-100 p-4 text-sm font-medium text-neutral-900">
      <WarningIcon />
      {isLoading ? (
        <Skeleton className="h-4 w-64" />
      ) : (
        <p>
          {days !== undefined
            ? t('hemi-earn.pool.form.cooldown-warning', { days })
            : t('hemi-earn.pool.form.cooldown-warning-fallback')}
        </p>
      )}
    </div>
  )
}
