'use client'

import { PageTitle } from 'components/pageTitle'
import { useTranslations } from 'next-intl'

export const TopSection = function () {
  const t = useTranslations('hemi-earn')

  return (
    <div className="mb-8 flex flex-col items-center justify-between gap-y-6 sm:mb-10 sm:w-2/3 sm:items-start lg:mb-12 lg:w-full xl:flex-row xl:items-center">
      <PageTitle subtitle={t('subheading')} title={t('heading')} />
    </div>
  )
}
