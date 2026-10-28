import { EarnedAmount } from './earnedAmount'
import { YourDepositsCard } from './yourDepositsCard'

const wrapperClassName =
  'flex w-full flex-col flex-wrap items-stretch justify-between gap-4 sm:flex-row md:flex-nowrap md:gap-6 [&>.card-container]:w-full [&>.card-container]:max-md:basis-[calc(50%-theme(spacing.2))]'

export const InfoCards = () => (
  <div className={wrapperClassName}>
    <YourDepositsCard />
    <EarnedAmount />
  </div>
)
