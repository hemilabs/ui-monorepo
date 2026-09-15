import { useMemo, useState } from 'react'

import { StakeForm } from './_components/stakeForm'
import { StakeTable } from './_components/stakeTable'
import {
  StakeTableFilter,
  type StakeTableFilterOptions,
} from './_components/stakeTable/stakeTableFilter'
import { StatsSection } from './_components/statsSection'
import { StakingDashboardProvider } from './_context/stakingDashboardContext'
import { useStakingPositions } from './_hooks/useStakingPositions'

export const HemiStakePage = function () {
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
      <StatsSection />
      <div className="mt-6 flex flex-col-reverse gap-6 lg:flex-row">
        <div className="w-full lg:w-1/2 xl:shrink xl:grow-2 xl:basis-0">
          <div className="mb-4 ml-1 flex flex-row md:w-fit">
            <StakeTableFilter filter={filter} onFilter={handleFilter} />
          </div>
          <StakeTable data={filteredData} filter={filter} loading={isLoading} />
        </div>
        <div className="w-full shrink-0 lg:sticky lg:top-4 lg:w-1/2 lg:shrink lg:self-start xl:flex-1">
          <StakeForm />
        </div>
      </div>
    </StakingDashboardProvider>
  )
}
