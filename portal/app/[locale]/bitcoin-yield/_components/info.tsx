import { EarningRate } from './earningRate'
import { Holders } from './holders'
import { PoolDeposits } from './poolDeposits'
import { PoolTokenValue } from './poolTokenValue'

export const Info = () => (
  <div className="flex w-full items-center gap-5 border-t border-solid border-neutral-300/55 pt-8 [&>.card-container]:w-full [&>.card-container]:max-w-64">
    <PoolDeposits />
    <Holders />
    <EarningRate />
    <PoolTokenValue />
  </div>
)
