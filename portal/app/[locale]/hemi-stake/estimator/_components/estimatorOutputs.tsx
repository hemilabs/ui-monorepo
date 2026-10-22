import { useEstimatorForecast } from '../_hooks/useEstimatorForecast'

import { ApyCard } from './apyCard'
import { PayoutsCard } from './payoutsCard'

export const EstimatorOutputs = function () {
  const { forecast, isBlended, isLoading, stakedReturnRatio, unavailable } =
    useEstimatorForecast()

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
    </div>
  )
}
