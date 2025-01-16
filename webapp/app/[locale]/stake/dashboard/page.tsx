'use client'

import { featureFlags } from 'app/featureFlags'
import { PageTitle } from 'components/pageTitle'
import { useTranslations } from 'next-intl'

const Page = function () {
  const t = useTranslations('stake-page')

  if (!featureFlags.stakeCampaignEnabled) return null

  return (
    <div className="h-fit-rest-screen">
      <PageTitle
        subtitle={t('dashboard.subtitle')}
        title={t('dashboard.title')}
      />
    </div>
  )
}

export default Page
