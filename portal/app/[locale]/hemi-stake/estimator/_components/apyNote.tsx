import { useTranslations } from 'use-intl'

import { WarningMessage } from '../../_components/warningMessage'

export const ApyNote = function () {
  const t = useTranslations('hemi-stake')

  return (
    <WarningMessage className="rounded-lg bg-neutral-100 p-4">
      {t('apy-estimate')}
    </WarningMessage>
  )
}
