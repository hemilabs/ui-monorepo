'use client'

import { featureFlags } from 'app/featureFlags'
import { PageTitle } from 'components/pageTitle'
import { useStakeTokens } from 'hooks/useStakeTokens'
import { useTranslations } from 'next-intl'

import { StakeAssetsTable } from './_components/stakeAssetsTable'
import {
  EarnedPoints,
  TotalStaked,
  YourStake,
} from './_components/stakePointsCards'

const Page = function () {
  const t = useTranslations('stake-page')

  const stakeTokens = useStakeTokens()

  if (!featureFlags.stakeCampaignEnabled) return null

  return (
    <div className="h-fit-rest-screen w-full">
      <PageTitle
        subtitle={t('dashboard.subtitle')}
        title={t('dashboard.title')}
      />
      <div className="mt-8 flex flex-col gap-6 lg:flex-row">
        <TotalStaked />
        <YourStake />
        <EarnedPoints />
      </div>
      <div className="mt-6 md:mt-8">
        <StakeAssetsTable
          // TODO - This is a mock data, replace it with the real data
          // Related to the issue #774 - https://github.com/hemilabs/ui-monorepo/issues/774
          data={[
            {
              staked: { monetaryValue: '112', quantity: '0.24' },
              token: stakeTokens.find(item => item.name === 'Merlin BTC')!,
            },
            {
              staked: { monetaryValue: '105', quantity: '0.50' },
              token: stakeTokens.find(item => item.name === 'pumpBTC')!,
            },
            {
              staked: { monetaryValue: '220', quantity: '1.25' },
              token: stakeTokens.find(
                item => item.name === 'Lorenzo Wrapped Bitcoin',
              )!,
            },
          ]}
          loading={false}
        />
      </div>
    </div>
  )
}

export default Page
