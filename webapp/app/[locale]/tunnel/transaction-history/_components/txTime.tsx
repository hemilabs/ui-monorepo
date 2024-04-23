'use client'

import { useLocale } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { Chain } from 'viem'
import { useBlock } from 'wagmi'

import { TimeAgo } from './timeAgo'

type Props = {
  blockNumber: bigint
  chainId: Chain['id']
}

export const TxTime = function ({ blockNumber, chainId }: Props) {
  const { data: block, isLoading } = useBlock({ blockNumber, chainId })
  const locale = useLocale()
  if (isLoading) {
    return <Skeleton className="w-24" />
  }
  const timestamp = block.timestamp as bigint
  return (
    <span className="text-sm">
      <TimeAgo locale={locale} timestamp={timestamp} />
    </span>
  )
}
