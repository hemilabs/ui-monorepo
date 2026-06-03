import { WarningIcon } from 'components/icons/warningIcon'
import { useTranslations } from 'next-intl'

export const CooldownWarning = function () {
  const t = useTranslations()
  return (
    <div className="flex items-center gap-x-1 rounded-lg bg-neutral-100 p-4 text-sm font-medium text-neutral-900">
      <WarningIcon />
      <p>{t('hemi-earn.pool.form.cooldown-warning')}</p>
    </div>
  )
}
