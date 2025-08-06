'use client'

import { useTranslations } from 'next-intl'

import { EmptyIcon } from '../../_icons/emptyIcon'

export function NoPositionStaked() {
  const t = useTranslations('staking-dashboard.table')
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <span className="flex size-8 items-center justify-center rounded-full bg-orange-50">
        <EmptyIcon />
      </span>
      <h3 className="mt-2 text-lg font-semibold text-neutral-950">
        {t('no-hemi-staked')}
      </h3>
      <span className="mt-1 text-sm font-medium text-neutral-500">
        {t('get-started')}
      </span>
    </div>
  )
}
