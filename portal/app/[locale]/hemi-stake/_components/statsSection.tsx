import { AverageLockup } from './averageLockup'
import { RewardsPaid } from './rewardsPaid'
import { TotalStaked } from './totalStaked'
import { WalletsStaking } from './walletsStaking'

export const StatsSection = () => (
  <section className="mt-8 grid w-full grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4 [&>.card-container]:min-w-0">
    <TotalStaked />
    <WalletsStaking />
    <AverageLockup />
    <RewardsPaid />
  </section>
)
