import { useEstimatorForecast } from '../_hooks/useEstimatorForecast'

import { ApyCard } from './apyCard'
import { PayoutsCard } from './payoutsCard'
import { ProjectionsCard } from './projectionsCard'

export const EstimatorOutputs = function () {
  const {
    currentEpoch,
    forecast,
    isBlended,
    isError,
    isLoading,
    retry,
    stakedReturnRatio,
    unavailable,
  } = useEstimatorForecast()

  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 [&>.card-container]:min-w-0">
      <PayoutsCard
        isError={unavailable}
        isLoading={isLoading}
        yearOneTotal={forecast.blended.yearOneTotal}
      />
      <ApyCard
        isError={unavailable}
        isLoading={isLoading}
        stakedReturnRatio={isBlended ? stakedReturnRatio : undefined}
        yearOneReturnRatio={forecast.blended.yearOneReturnRatio}
      />
      <div className="min-w-0 md:col-span-2">
        <ProjectionsCard
          blended={forecast.blended.payouts}
          currentEpoch={currentEpoch}
          existing={forecast.existing.payouts}
          incoming={forecast.incoming.payouts}
          isBlended={isBlended}
          isError={unavailable}
          isLoading={isLoading}
          lockEnd={forecast.blended.lockEnd}
          onRetry={isError ? retry : undefined}
        />
      </div>
    </div>
  )
}
