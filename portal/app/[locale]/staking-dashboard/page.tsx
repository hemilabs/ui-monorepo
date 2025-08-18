'use client'

import { PageLayout } from 'components/pageLayout'
import { useTranslations } from 'next-intl'

import { StakeForm } from './_components/stakeForm'
import { StakeTable } from './_components/stakeTable'
import { useStakingDashboardState } from './_hooks/useStakingDashboardState'
import { useStakingPositions } from './_hooks/useStakingPositions'

function Page() {
  const t = useTranslations('staking-dashboard')
  const state = useStakingDashboardState()

  const { data, isLoading } = useStakingPositions()

  return (
    <PageLayout variant="superWide">
      <div className="flex flex-col">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-950">
          {t('heading')}
        </h1>
        <p className="text-sm font-normal text-neutral-500">
          {t('sub-heading')}
        </p>
        <div className="mt-8 flex flex-col-reverse gap-6 md:flex-row">
          <div className="w-full md:w-1/2 lg:w-3/5">
            <StakeTable data={data} loading={isLoading} />
          </div>
          <div className="w-full md:w-1/2 lg:w-2/5">
            <StakeForm state={state} />
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default Page
