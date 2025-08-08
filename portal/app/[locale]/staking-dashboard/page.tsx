'use client'

import { PageLayout } from 'components/pageLayout'
import { useTranslations } from 'next-intl'

import { StakeForm } from './_components/stakeForm'
import { StakeTable } from './_components/stakeTable'
import { useStakingDashboardState } from './_hooks/useStakingDashboardState'
import { generateStakingDashboardOperations } from './_utils/mockedData'

function Page() {
  const t = useTranslations('staking-dashboard')
  const stakingDashboardState = useStakingDashboardState()

  const props = {
    state: stakingDashboardState,
  }

  /**
   * @temporary
   * //TODO: This page component is temporarily using mocked staking dashboard tokens for development purposes.
   * The mock data will be replaced with real data integration in the future.
   */
  const mockStakingDashboardOperations = generateStakingDashboardOperations()

  return (
    <PageLayout variant="wide">
      <div className="flex flex-col">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-950">
          {t('heading')}
        </h1>
        <p className="text-sm font-normal text-neutral-500">
          {t('sub-heading')}
        </p>
        <div className="mt-8 flex flex-col-reverse gap-6 md:flex-row">
          <div className="w-full md:w-3/5">
            <StakeTable
              data={[...mockStakingDashboardOperations]}
              loading={false}
            />
          </div>
          <div className="w-full md:w-2/5">
            <StakeForm {...props} />
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default Page
