'use client'

import { PageLayout } from 'components/pageLayout'
import { useHemiToken } from 'hooks/useHemiToken'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { StakeForm } from './_components/stakeForm'
import { StakeTable } from './_components/stakeTable'
import {
  StakeTableFilter,
  type StakeTableFilterOptions,
} from './_components/stakeTable/stakeTableFilter'
import { StakingDashboardDisabledTestnet } from './_components/stakingDashboardDisabledTestnet'
import { StakingDashboardProvider } from './_context/stakingDashboardContext'
import { useStakingPositions } from './_hooks/useStakingPositions'
import { isStakingDashboardEnabledOnTestnet } from './_utils/isStakingDashboardEnabledOnTestnet'

function StakingContent() {
  const { data, isLoading } = useStakingPositions()

  const [filter, setFilter] = useState<StakeTableFilterOptions>('active')

  function handleFilter(newFilter: StakeTableFilterOptions) {
    setFilter(newFilter)
  }

  const filteredData = useMemo(
    () => data?.filter(position => position.status === filter),
    [data, filter],
  )

  return (
    <StakingDashboardProvider>
      <div className="mt-8 flex flex-col-reverse gap-6 lg:flex-row">
        <div className="w-full lg:w-1/2 xl:flex-[65] 2xl:w-full">
          <div className="mb-4 ml-1 flex flex-row md:w-fit">
            <StakeTableFilter filter={filter} onFilter={handleFilter} />
          </div>
          <StakeTable data={filteredData} loading={isLoading} />
        </div>
        <div className="w-full lg:w-1/2 xl:flex-[35] 2xl:w-fit 2xl:flex-none">
          <StakeForm />
        </div>
      </div>
    </StakingDashboardProvider>
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
        <h1 className="mb-1 text-4xl font-semibold text-neutral-950">
          {t('heading', { symbol })}
        </h1>
        {isEnabled ? <StakingContent /> : <StakingDashboardDisabledTestnet />}
      </div>
    </PageLayout>
  )
}

export default Page
