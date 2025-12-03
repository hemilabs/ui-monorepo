import { EarningRate } from './earningRate'
import { Holders } from './holders'
import { PoolDeposits } from './poolDeposits'
import { PoolTokenValue } from './poolTokenValue'

export const Info = () => (
  <div
    className="xs:flex-row flex w-full flex-col flex-wrap items-center justify-between gap-4 md:flex-nowrap md:gap-5
      [&>.card-container]:w-full [&>.card-container]:max-md:basis-[calc(50%-theme(spacing.2))]"
  >
    <PoolDeposits />
    <Holders />
    <EarningRate />
    <PoolTokenValue />
  </div>
)
