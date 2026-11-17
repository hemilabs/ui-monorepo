import { useTranslations } from 'use-intl'

import { StakeDrawers } from '../_components/stakeDrawers'
import { StakingDashboardProvider } from '../_context/stakingDashboardContext'

import { ApyNote } from './_components/apyNote'
import { EstimatorInputs } from './_components/estimatorInputs'
import { EstimatorOutputs } from './_components/estimatorOutputs'
import { EstimatorProvider } from './_context/estimatorContext'

export const HemiStakeEstimatorPage = function () {
  const t = useTranslations('hemi-stake.estimator')

  return (
    <StakingDashboardProvider>
      <EstimatorProvider>
        <StakeDrawers
          stakeToastGoTo={{ href: '/hemi-stake', label: t('view-position') }}
        />
        <div className="mt-6 flex flex-col-reverse gap-6 lg:flex-row">
          <div className="w-full lg:w-1/2 xl:shrink xl:grow-2 xl:basis-0">
            <EstimatorOutputs />
          </div>
          <div className="flex w-full shrink-0 flex-col gap-y-6 lg:w-1/2 lg:shrink lg:self-start xl:flex-1">
            <EstimatorInputs />
            <ApyNote />
          </div>
        </div>
      </EstimatorProvider>
    </StakingDashboardProvider>
  )
}
