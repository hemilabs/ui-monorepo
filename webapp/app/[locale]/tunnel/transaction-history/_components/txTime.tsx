'use client'

import { useLocale } from 'next-intl'
import Skeleton from 'react-loading-skeleton'

import { TimeAgo } from './timeAgo'

type Props = {
  timestamp: number
}

export const TxTime = function (props: Props) {
  const locale = useLocale()
  // Unconfirmed TXs won't have a timestamp
  if (!props.timestamp) {
    return <Skeleton className="w-15 h-8" />
  }
  return (
    <span className="text-neutral-600">
      <TimeAgo locale={locale} {...props} />
    </span>
  )
}
