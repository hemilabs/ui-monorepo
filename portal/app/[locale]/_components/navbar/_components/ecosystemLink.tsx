import { EcosystemIcon } from 'components/icons/ecosystemIcon'
import { useTranslations } from 'use-intl'

import { ItemLink } from './itemLink'

export const EcosystemLink = function () {
  const t = useTranslations('navbar')

  return (
    <ItemLink
      event="nav - ecosystem"
      href="/ecosystem"
      icon={
        <div className="w-8 md:w-3">
          <EcosystemIcon />
        </div>
      }
      text={t('ecosystem')}
    />
  )
}
