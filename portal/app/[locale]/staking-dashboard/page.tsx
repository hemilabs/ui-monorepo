import { PageLayout } from 'components/pageLayout'
import { PageTitle } from 'components/pageTitle'
import { TestnetDisabled } from 'components/testnetDisabled'
import { useHemiToken } from 'hooks/useHemiToken'
import { useNetworkType } from 'hooks/useNetworkType'
import { useMemo, useState } from 'react'
import { useTranslations } from 'use-intl'

import { ClaimAllRewards } from './_components/claimAllRewards'
import { StakeForm } from './_components/stakeForm'
import { StakeTable } from './_components/stakeTable'
import {
  StakeTableFilter,
  type StakeTableFilterOptions,
} from './_components/stakeTable/stakeTableFilter'
import { VotingPowerSummary } from './_components/votingPowerSummary'
import { StakingDashboardProvider } from './_context/stakingDashboardContext'
import { useStakingPositions } from './_hooks/useStakingPositions'
import { isStakingDashboardEnabledOnTestnet } from './_utils/isStakingDashboardEnabledOnTestnet'

function StakingContent() {
  // `isLoadingError`, not `isError`: react-query keeps the previous data when a
  // BACKGROUND refetch fails, and the table filters that data per tab. Deciding from
  // `isError` put "we couldn't load your positions" on any tab that was legitimately
  // empty while the other tab rendered the rows - the page contradicting itself.
  const { data, isLoading, isLoadingError } = useStakingPositions()

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
      <div className="mt-12 w-full">
        <VotingPowerSummary />
      </div>
      <div className="mt-6 flex flex-col-reverse gap-6 lg:flex-row">
        <div className="w-full lg:w-1/2 xl:shrink xl:grow-2 xl:basis-0">
          {/* Above the tabs, not inside one of them: the total covers every position
              the wallet is listed for, and a figure that changed with the filter would
              be a different number under the same label. */}
          <ClaimAllRewards positions={data} />
          <div className="mb-4 ml-1 flex flex-row md:w-fit">
            <StakeTableFilter filter={filter} onFilter={handleFilter} />
          </div>
          <StakeTable
            data={filteredData}
            filter={filter}
            hasError={isLoadingError}
            loading={isLoading}
          />
        </div>
        <div className="w-full shrink-0 lg:sticky lg:top-4 lg:w-1/2 lg:shrink lg:self-start xl:flex-1">
          <StakeForm />
        </div>
      </div>
    </StakingDashboardProvider>
  )
}

export const StakingDashboardPage = function () {
  const t = useTranslations('staking-dashboard')
  const [networkType] = useNetworkType()
  const { symbol } = useHemiToken()

  const isEnabled = isStakingDashboardEnabledOnTestnet(networkType)

  return (
    <PageLayout variant="superWide">
      <div className="flex flex-col">
        <PageTitle title={t('heading', { symbol })} />
        {isEnabled ? (
          <StakingContent />
        ) : (
          <TestnetDisabled subtitle={t('switch-to-start-staking')} />
        )}
      </div>
    </PageLayout>
  )
}
