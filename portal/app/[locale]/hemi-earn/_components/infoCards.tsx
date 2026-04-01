import { TotalAvgApy } from './totalAvgApy'
import { TotalDeposits } from './totalDeposits'
import { TotalYieldEarned } from './totalYieldEarned'

export const InfoCards = () => (
  <div
    className="xs:flex-row flex w-full flex-col flex-wrap items-stretch justify-between gap-4 md:flex-nowrap md:gap-5
      [&>.card-container]:w-full [&>.card-container]:max-md:basis-[calc(50%-theme(spacing.2))]"
  >
    <TotalDeposits />
    <TotalYieldEarned />
    <TotalAvgApy />
  </div>
)
