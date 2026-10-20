import { WarningIcon } from 'components/icons/warningIcon'
import { useTranslations } from 'use-intl'

export const ApyNote = function () {
  const t = useTranslations('hemi-stake')

  return (
    <div className="flex items-start gap-x-1 rounded-lg bg-neutral-100 p-4 text-sm font-medium text-neutral-900">
      <span className="mt-0.5 shrink-0">
        <WarningIcon />
      </span>
      <p>{t('apy-estimate')}</p>
    </div>
  )
}
