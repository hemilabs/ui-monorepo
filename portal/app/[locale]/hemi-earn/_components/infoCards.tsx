import { EarnedAmount } from './earnedAmount'
import { Rewards } from './rewards'
import { StakedBalance } from './stakedBalance'

const wrapperClassName =
  'flex w-full flex-col flex-wrap items-stretch justify-between gap-4 sm:flex-row md:flex-nowrap md:gap-5 [&>.card-container]:w-full [&>.card-container]:max-md:basis-[calc(50%-theme(spacing.2))]'

export const InfoCards = () => (
  <div className={wrapperClassName}>
    <StakedBalance />
    <EarnedAmount />
    <Rewards />
  </div>
)
