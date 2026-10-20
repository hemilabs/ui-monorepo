import { WarningBox } from 'components/warningBox'
import { useTranslations } from 'use-intl'

export const ApyNote = function () {
  const t = useTranslations('hemi-stake')
  const tCommon = useTranslations('common')

  return <WarningBox heading={tCommon('apy')} subheading={t('apy-estimate')} />
}
