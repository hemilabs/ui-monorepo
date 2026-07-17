'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

import { sharesToPeggedOptions } from '../../_fetchers/fetchSharesToPegged'
import { useEarnPositions } from '../../_hooks/useEarnPositions'
import { type EarnPool } from '../../types'
import { RenderEarnFiatBalance } from '../earnFiatBalance'

import { PoolInfoItem } from './poolInfoItem'

type Props = {
  pool: EarnPool
}

export const StakedAmount = function ({ pool }: Props) {
  const t = useTranslations('hemi-earn.pool-info')
  const { data: positions, isPending } = useEarnPositions()

  const position = positions.find(
    ({ shareAddress }) => shareAddress === pool.shareAddress,
  )

  // Shares → pegged shares the query key with FromPoolsBadge and useTotalDeposits,
  // so this adds no extra RPC calls.
  const { data, status } = useQuery(
    sharesToPeggedOptions({
      shareAddress: pool.shareAddress,
      shares: position?.yourDeposit ?? BigInt(0),
    }),
  )

  if (position) {
    return (
      <PoolInfoItem label={t('staked-balance')}>
        <span className="body-text-medium text-neutral-950">
          $
          <RenderEarnFiatBalance
            balance={data?.peggedAmount}
            queryStatus={status}
            token={position.peggedToken}
          />
        </span>
      </PoolInfoItem>
    )
  }

  return <PoolInfoItem isLoading={isPending} label={t('staked-balance')} />
}
