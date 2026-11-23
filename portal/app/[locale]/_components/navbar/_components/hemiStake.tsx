import { HemiStakeIcon } from 'components/icons/hemiStakeIcon'
import { useTranslations } from 'use-intl'

import { ItemLink } from './itemLink'

export const HemiStake = function () {
  const t = useTranslations('navbar')

  return (
    <ItemLink
      event="nav - hemi stake"
      href="/hemi-stake"
      icon={<HemiStakeIcon className="w-7 md:w-3" />}
      text={t('hemi-stake')}
    />
  )
}
