'use client'

import { PageLayout } from 'components/pageLayout'
import { useHemiToken } from 'hooks/useHemiToken'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTranslations } from 'next-intl'

import { StakeForm } from './_components/stakeForm'
import { StakeTable } from './_components/stakeTable'
import { StakingDashboardDisabledTestnet } from './_components/stakingDashboardDisabledTestnet'
import { useStakingPositions } from './_hooks/useStakingPositions'
import { isStakingDashboardEnabledOnTestnet } from './_utils/isStakingDashboardEnabledOnTestnet'

function StakingContent() {
  const { data, isLoading } = useStakingPositions()

  return (
    <div className="mt-8 flex flex-col-reverse gap-6 lg:flex-row">
      <div className="w-full lg:w-1/2 lg:flex-initial 2xl:w-full">
        <StakeTable data={data} loading={isLoading} />
      </div>
      <div className="w-full lg:w-fit lg:flex-auto lg:flex-shrink-0 lg:basis-1/2 2xl:w-fit 2xl:flex-none">
        <StakeForm />
      </div>
    </div>
  )
}

function Page() {
  const t = useTranslations('staking-dashboard')
  const [networkType] = useNetworkType()
  const { symbol } = useHemiToken()

  const isEnabled = isStakingDashboardEnabledOnTestnet(networkType)

  return (
    <PageLayout variant="superWide">
      <div className="flex flex-col">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-950">
          {t('heading', { symbol })}
        </h1>
        <p className="text-sm font-normal text-neutral-500">
          {t('sub-heading', { symbol })}
        </p>
        {isEnabled ? <StakingContent /> : <StakingDashboardDisabledTestnet />}
      </div>
    </PageLayout>
  )
}

export default Page
