import Skeleton from 'react-loading-skeleton'

import { useEarnPools } from '../_hooks/useEarnVaults'

import { PoolInfoBar } from './vaultInfoBar'

const PoolInfoBarSkeleton = () => (
  <Skeleton className="h-58 w-full rounded-xl md:h-19.5" />
)

export const PoolsList = function () {
  const { data: pools = [], isPending } = useEarnPools()

  if (!isPending) {
    return (
      <div className="flex flex-col gap-4">
        {pools.map(pool => (
          <PoolInfoBar key={pool.shareAddress} pool={pool} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PoolInfoBarSkeleton />
    </div>
  )
}
