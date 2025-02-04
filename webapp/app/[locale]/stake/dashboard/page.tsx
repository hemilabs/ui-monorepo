'use client'

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
        <StakeAssetsTable data={stakeTokens} loading={false} />
      </div>
    </div>
  )
}

export default Page
