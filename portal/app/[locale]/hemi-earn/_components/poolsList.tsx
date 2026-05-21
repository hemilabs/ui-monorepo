'use client'

import Skeleton from 'react-loading-skeleton'

import { useEarnPools } from '../_hooks/useEarnPools'

import { PoolInfoBar } from './poolInfoBar'

const PoolInfoBarSkeleton = () => (
  <Skeleton className="h-19 w-full rounded-xl" />
)

type Props = {
  placeholderCount?: number
}

export const PoolsList = function ({ placeholderCount = 2 }: Props) {
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
      {Array.from({ length: placeholderCount }).map((_, i) => (
        <PoolInfoBarSkeleton key={i} />
      ))}
    </div>
  )
}
