import { Badge } from 'components/badge'
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
      rightSection={
        <div className="ml-auto hidden md:flex md:items-center">
          <Badge size="small" variant="primaryB">
            {t('new')}
          </Badge>
        </div>
      }
      text={t('hemi-stake')}
    />
  )
}
