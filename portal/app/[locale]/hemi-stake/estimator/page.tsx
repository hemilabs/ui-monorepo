import { ApyNote } from './_components/apyNote'
import { EstimatorInputs } from './_components/estimatorInputs'
import { EstimatorProvider } from './_context/estimatorContext'

export const HemiStakeEstimatorPage = () => (
  <EstimatorProvider>
    <div className="mx-auto mt-6 flex w-full flex-col gap-y-6 lg:max-w-[457px]">
      <EstimatorInputs />
      <ApyNote />
    </div>
  </EstimatorProvider>
)
