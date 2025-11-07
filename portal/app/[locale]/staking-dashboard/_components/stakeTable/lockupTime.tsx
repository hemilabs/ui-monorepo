import { DurationTime } from 'components/durationTime'
import Skeleton from 'react-loading-skeleton'

import { useCalculateApy } from '../../_hooks/useCalculateApy'

type Props = {
  lockupTime: bigint
  tokenId: string
}

export const LockupTime = function ({ lockupTime, tokenId }: Props) {
  const seconds = Number(lockupTime)
  const {
    data: apy,
    error,
    isLoading,
  } = useCalculateApy({ tokenId: BigInt(tokenId) })

  const renderApy = function () {
    if (isLoading) {
      return <Skeleton className="h-4 w-16" />
    }

    if (error || apy === undefined) {
      return <span className="text-xs font-normal text-neutral-500">-</span>
    }

    return (
      <span className="text-xs font-normal text-emerald-600">{apy}% APY</span>
    )
  }

  return (
    <div className="flex flex-col">
      <span className="text-neutral-500">
        <DurationTime seconds={seconds} />
      </span>
      {renderApy()}
    </div>
  )
}
