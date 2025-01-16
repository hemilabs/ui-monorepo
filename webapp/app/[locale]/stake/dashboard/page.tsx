'use client'

import { featureFlags } from 'app/featureFlags'
import { PageTitle } from 'components/pageTitle'
import { useTranslations } from 'next-intl'

import {
  EarnedPoints,
  TotalStaked,
  YourStake,
} from './_components/stakePointsCards'

const Page = function () {
  const t = useTranslations('stake-page')

  if (!featureFlags.stakeCampaignEnabled) return null

  return (
    <div className="h-fit-rest-screen">
      <PageTitle
        subtitle={t('dashboard.subtitle')}
        title={t('dashboard.title')}
      />
      <div className="mt-8 flex flex-col gap-6 lg:flex-row">
        <TotalStaked />
        <YourStake />
        <EarnedPoints />
      </div>
    </div>
  )
}

export default Page
