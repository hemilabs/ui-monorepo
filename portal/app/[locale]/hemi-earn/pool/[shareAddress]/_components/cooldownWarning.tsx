import { WarningIcon } from 'components/icons/warningIcon'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'

type Props = {
  days: number | undefined
  isLoading: boolean
}

export const CooldownWarning = function ({ days, isLoading }: Props) {
  const t = useTranslations()
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
