'use client'

import { InRelativeTime } from 'components/inRelativeTime'
import Skeleton from 'react-loading-skeleton'

type Props = {
  timestamp: number | undefined
}

export const TxTime = function ({ timestamp }: Props) {
  // Unconfirmed TXs won't have a timestamp
  if (timestamp === undefined) {
    return <Skeleton className="w-15 h-8" />
  }

  return (
    <span className="text-neutral-600">
      <InRelativeTime timestamp={timestamp} />
    </span>
  )
}
