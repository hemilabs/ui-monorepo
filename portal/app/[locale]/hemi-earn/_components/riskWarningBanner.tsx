import { WarningBox } from 'components/warningBox'
import { useTranslations } from 'use-intl'

export const RiskWarningBanner = function () {
  const t = useTranslations('hemi-earn')

  return (
    <div className="px-4 py-6 md:px-6">
      <WarningBox subheading={t('risk-warning')} />
    </div>
  )
}
