'use client'

import { useLocale } from 'next-intl'

import { TimeAgo } from './timeAgo'

type Props = {
  timestamp: number
}

export const TxTime = function (props: Props) {
  const locale = useLocale()
  // Unconfirmed TXs won't have a timestamp
  if (!props.timestamp) {
    return null
  }
  return (
    <span className="text-neutral-600">
      <TimeAgo locale={locale} {...props} />
    </span>
  )
}
