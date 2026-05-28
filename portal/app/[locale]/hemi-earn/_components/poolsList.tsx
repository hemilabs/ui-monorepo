'use client'

import Skeleton from 'react-loading-skeleton'

import { useEarnPools } from '../_hooks/useEarnPools'

import { PoolInfoBar } from './poolInfoBar'

const PoolInfoBarSkeleton = () => (
  <Skeleton className="md:h-19.5 h-58 w-full rounded-xl" />
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
