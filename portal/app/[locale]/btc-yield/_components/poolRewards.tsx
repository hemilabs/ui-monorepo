import Skeleton from 'react-loading-skeleton'
import { useAccount } from 'wagmi'

import { useMerklRewards } from '../_hooks/useMerklRewards'

import { Rewards } from './rewards'
import { UsdRewards } from './usdRewards'

export const PoolRewards = function () {
  const { address } = useAccount()
  const { data: merklRewards, isError } = useMerklRewards()

  const errorOrDisconnected = isError || !address
  const loaded = merklRewards !== undefined
  const withRewards = loaded && merklRewards.length > 0
  const noRewards = loaded && merklRewards.length === 0

  return (
    <div className="flex flex-col gap-y-0.5">
      <span className="body-text-medium text-neutral-950">
        {withRewards ? (
          // here rewards are defined
          <Rewards merklRewards={merklRewards} />
        ) : errorOrDisconnected || noRewards ? (
          '-'
        ) : (
          <Skeleton className="h-4 w-16" />
        )}
      </span>
      <span className="body-text-normal text-neutral-500">
        {/* Don't render a "-" - there will be one above, let's avoid the duplicate "-" */}
        {withRewards ? (
          // here rewards are defined
          <UsdRewards merklRewards={merklRewards} />
        ) : errorOrDisconnected || noRewards ? null : (
          <Skeleton className="h-full" />
        )}
      </span>
    </div>
  )
}
