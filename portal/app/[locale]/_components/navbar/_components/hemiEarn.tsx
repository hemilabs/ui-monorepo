import { Badge } from 'components/badge'
import { HemiEarnIcon } from 'components/icons/hemiEarnIcon'
import { Suspense } from 'react'
import { useTranslations } from 'use-intl'

import { ItemLink } from './itemLink'

export const HemiEarn = function () {
  const t = useTranslations('navbar')

  return (
    <Suspense>
      <ItemLink
        event="nav - hemi earn"
        href="/hemi-earn"
        icon={<HemiEarnIcon />}
        rightSection={
          <div className="ml-auto hidden md:flex md:items-center">
            <Badge size="small" variant="primaryB">
              {t('by-vetro')}
            </Badge>
          </div>
        }
        text={t('hemi-earn')}
      />
    </Suspense>
  )
}
