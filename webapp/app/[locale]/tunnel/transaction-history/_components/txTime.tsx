'use client'

import { useLocale } from 'next-intl'

import { TimeAgo } from './timeAgo'

type Props = {
  timestamp: number
}

export const TxTime = function (props: Props) {
  const locale = useLocale()
  return (
    <span className="text-sm">
      <TimeAgo locale={locale} {...props} />
    </span>
  )
}
