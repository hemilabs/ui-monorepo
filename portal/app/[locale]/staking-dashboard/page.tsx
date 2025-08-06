'use client'

import { PageLayout } from 'components/pageLayout'
import { useTranslations } from 'next-intl'

import { StakeTable } from './_components/stakeTable'
import { generateStakingDashboardOperations } from './_utils/mockedData'

function Page() {
  const t = useTranslations('staking-dashboard')

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
        <div className="mt-8 flex w-full space-x-6">
          <StakeTable
            data={[...mockStakingDashboardOperations]}
            loading={false}
          />
        </div>
      </div>
    </PageLayout>
  )
}

export default Page
