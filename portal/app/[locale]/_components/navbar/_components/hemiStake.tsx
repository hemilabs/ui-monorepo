import { HemiStakeIcon } from 'components/icons/hemiStakeIcon'
import { useTranslations } from 'use-intl'

import { ItemLink } from './itemLink'

export const HemiStake = function () {
  const t = useTranslations('navbar')

  return (
    <ItemLink
      event="nav - hemi stake"
      href="/hemi-stake"
      icon={<HemiStakeIcon />}
      rightSection={
        <div className="ml-auto hidden md:flex md:items-center">
          <span className="body-text-caption flex items-center rounded-md bg-orange-600 px-1.5 py-px text-white">
            {t('new')}
          </span>
        </div>
      }
      text={t('hemi-stake')}
    />
  )
}
