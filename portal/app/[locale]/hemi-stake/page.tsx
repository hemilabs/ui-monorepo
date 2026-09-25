import { useMemo, useState } from 'react'
import { StakingPositionStatus } from 'types/stakingDashboard'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { GetStartedSection } from './_components/getStartedSection'
import { PerksSection } from './_components/perksSection'
import { StakeForm } from './_components/stakeForm'
import { StakeTable } from './_components/stakeTable'
import { ClaimAllRewards } from './_components/stakeTable/claimAllRewards'
import {
  StakeTableFilter,
  type StakeTableFilterOptions,
} from './_components/stakeTable/stakeTableFilter'
import { WalletStatsSection } from './_components/walletStatsSection'
import { StakingDashboardProvider } from './_context/stakingDashboardContext'
import { useStakingPositions } from './_hooks/useStakingPositions'

export const HemiStakePage = function () {
  const { data, isFetching, isLoading, isLoadingError, refetch } =
    useStakingPositions()
  const { status } = useAccount()

  const [filter, setFilter] = useState<StakeTableFilterOptions>('active')

  function handleFilter(newFilter: StakeTableFilterOptions) {
    setFilter(newFilter)
  }

  const filteredData = useMemo(
    function () {
      const positions = data?.filter(position => position.status === filter)
      return filter === StakingPositionStatus.WITHDRAWN
        ? positions?.reverse()
        : positions
    },
    [data, filter],
  )

  const isConnected = walletIsConnected(status)

  return (
    <StakingDashboardProvider>
      {isConnected ? <WalletStatsSection /> : null}
      <div
        className={`mt-6 flex gap-6 lg:flex-row ${
          isConnected ? 'flex-col-reverse' : 'flex-col'
        }`}
      >
        <div className="w-full lg:w-1/2 xl:shrink xl:grow-2 xl:basis-0">
          {isConnected ? (
            <div className="mb-4 ml-1 flex flex-row items-center justify-between gap-x-2">
              <div className="flex flex-1 md:w-fit md:flex-none">
                <StakeTableFilter filter={filter} onFilter={handleFilter} />
              </div>
              <ClaimAllRewards positions={data} />
            </div>
          ) : null}
          <StakeTable
            data={filteredData}
            filter={filter}
            isError={isLoadingError}
            isRetrying={isFetching}
            loading={isLoading}
            onRetry={() => refetch()}
          />
          <PerksSection />
          <GetStartedSection />
        </div>
        <div className="w-full shrink-0 lg:sticky lg:top-4 lg:w-1/2 lg:shrink lg:self-start xl:flex-1">
          <StakeForm />
        </div>
      </div>
    </StakingDashboardProvider>
  )
}
