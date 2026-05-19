import { type PoolBreakdown } from '../types'

import { TokenDisplay } from './tokenDisplay'

type Props = {
  poolBreakdown: PoolBreakdown[]
}

export const PoolBreakdownTooltip = ({ poolBreakdown }: Props) => (
  <div className="flex min-w-40 flex-col gap-y-1">
    {poolBreakdown.map(pool => (
      <div
        className="flex items-center justify-between gap-x-4"
        key={`${pool.tokenChainId}-${pool.tokenAddress}`}
      >
        <div className="flex items-center gap-x-1">
          <TokenDisplay
            address={pool.tokenAddress}
            chainId={pool.tokenChainId}
            size="small"
          />
          <span className="body-text-medium text-white">{pool.name}</span>
        </div>
        <span className="body-text-medium text-white">{pool.value}</span>
      </div>
    ))}
  </div>
)
