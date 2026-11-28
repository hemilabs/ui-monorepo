import { useTranslations } from 'use-intl'

export const VetroDataDisclaimer = function () {
  const t = useTranslations('hemi-earn')

  return (
    <p className="body-text-caption text-neutral-500">
      {t('vetro-data-disclaimer')}
    </p>
  )
}
