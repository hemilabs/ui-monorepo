'use client'

import { featureFlags } from 'app/featureFlags'
import { PageTitle } from 'components/pageTitle'
import { useTranslations } from 'next-intl'

const Stake = function () {
  const t = useTranslations('stake-page')

  if (!featureFlags.stakeCampaignEnabled) return null

  return (
    <div className="h-fit-rest-screen">
      <PageTitle subtitle={t('stake.subtitle')} title={t('stake.title')} />
    </div>
  )
}

export default function Page() {
  return <Stake />
}
