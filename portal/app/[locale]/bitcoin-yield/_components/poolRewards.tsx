import Skeleton from 'react-loading-skeleton'
import { useAccount } from 'wagmi'

import { usePoolRewards } from '../_hooks/usePoolRewards'

import { Rewards } from './rewards'
import { UsdRewards } from './usdRewards'

export const PoolRewards = function () {
  const { address } = useAccount()
  const { data: poolRewards, isError } = usePoolRewards()

  const errorOrDisconnected = isError || !address
  const loading = poolRewards === undefined

  return (
    <div className="flex flex-col">
      <span className="body-text-medium text-neutral-950">
        {errorOrDisconnected ? (
          '-'
        ) : loading ? (
          <Skeleton className="h-4 w-16" />
        ) : (
          <Rewards amounts={poolRewards[1]} tokenAddresses={poolRewards[0]} />
        )}
      </span>
      <span className="body-text-normal text-neutral-500">
        {/* Don't render a "-" - there will be one above, let's avoid the duplicate "-" */}
        {errorOrDisconnected ? null : loading ? (
          <Skeleton className="h-full" />
        ) : (
          <UsdRewards
            amounts={poolRewards[1]}
            tokenAddresses={poolRewards[0]}
          />
        )}
      </span>
    </div>
  )
}
