'use client'

import { PageTitle } from 'components/pageTitle'
import { useTranslations } from 'next-intl'

import { CmcAttribution } from '../_components/cmcAttribution'

import { StakeAssetsTable } from './_components/stakeAssetsTable'
import {
  EarnedPoints,
  TotalStaked,
  YourStake,
} from './_components/stakePointsCards'

const Page = function () {
  const t = useTranslations('stake-page')

  return (
    <div className="h-fit-rest-screen w-full pb-4 md:pb-0">
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
        <StakeAssetsTable />
      </div>
      <div className="mt-6">
        <CmcAttribution />
      </div>
    </div>
  )
}

export default Page
