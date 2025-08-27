'use client'

import { InRelativeTime } from 'components/inRelativeTime'
import Skeleton from 'react-loading-skeleton'

type Props = {
  timestamp: number
}

export const TxTime = function (props: Props) {
  // Unconfirmed TXs won't have a timestamp
  if (!props.timestamp) {
    return <Skeleton className="w-15 h-8" />
  }
  return (
    <span className="text-neutral-600">
      <InRelativeTime {...props} />
    </span>
  )
}
