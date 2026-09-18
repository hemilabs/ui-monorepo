import { AverageLockup } from './averageLockup'
import { TotalStaked } from './totalStaked'
import { WalletsStaking } from './walletsStaking'

export const StatsSection = () => (
  <section className="mt-8 grid w-full grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 [&>.card-container:first-child]:col-span-2 lg:[&>.card-container:first-child]:col-span-1 [&>.card-container]:min-w-0">
    <TotalStaked />
    <WalletsStaking />
    <AverageLockup />
  </section>
)
