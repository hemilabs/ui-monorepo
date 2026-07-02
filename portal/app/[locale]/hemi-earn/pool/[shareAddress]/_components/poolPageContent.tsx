'use client'

import { PageLayout } from 'components/pageLayout'
import { useNetworkType } from 'hooks/useNetworkType'
import { useRouter } from 'i18n/navigation'
import { useLocale } from 'next-intl'
import { useEffect, useRef } from 'react'
import Skeleton from 'react-loading-skeleton'
import { queryStringObjectToString } from 'utils/url'
import { type Address } from 'viem'

import { useEarnPools } from '../../../_hooks/useEarnPools'
import { findPoolByShare } from '../../../_utils'
import { PoolFormProvider } from '../_context/poolFormContext'

import { Composition } from './composition'
import { HistoricalMetrics } from './historicalMetrics'
import { PoolForm } from './poolForm'
import { PoolInfoCards } from './poolInfoCards'
import { PoolNavigation } from './poolNavigation'

type Props = {
  shareAddress: string
}

export const PoolPageContent = function ({ shareAddress }: Props) {
  const router = useRouter()
  const locale = useLocale()
  const [networkType] = useNetworkType()
  const { data: pools, isPending } = useEarnPools()

  const pool = pools
    ? findPoolByShare(pools, shareAddress as Address)
    : undefined

  const networkTypeRef = useRef(networkType)
  useEffect(
    function redirectOnNetworkChange() {
      if (networkTypeRef.current === networkType) return
      networkTypeRef.current = networkType
      // nuqs defers its URL flush via setTimeout(~50ms). Calling router.push
      // here fires immediately but nuqs's flush overwrites it 50ms later with
      // the pool URL + ?networkType. Instead, we pre-set location.pathname to
      // /hemi-earn via history.pushState *before* nuqs flushes. nuqs then reads
      // the updated pathname and applies ?networkType to the earn page URL,
      // and its own router.replace finishes the navigation — no hard reload needed.
      history.pushState(null, '', `/${locale}/hemi-earn`)
    },
    [locale, networkType],
  )

  useEffect(
    function redirectIfNotFound() {
      if (!isPending && !pool) {
        router.push(`/hemi-earn${queryStringObjectToString({ networkType })}`)
      }
    },
    [isPending, networkType, pool, router],
  )

  if (isPending) {
    return (
      <PageLayout variant="wide">
        <Skeleton className="h-7 w-48 rounded-md" />
        <div className="mt-8 flex gap-4">
          <Skeleton className="h-24 flex-1 rounded-xl" />
          <Skeleton className="h-24 flex-1 rounded-xl" />
        </div>
      </PageLayout>
    )
  }

  if (!pool) {
    return null
  }

  return (
    <PageLayout variant="wide">
      <PoolFormProvider pool={pool}>
        <PoolNavigation pool={pool} />
        <div className="mt-6 flex flex-col gap-3 md:gap-5 lg:flex-row">
          <div className="order-2 flex flex-col gap-4 md:gap-5 lg:order-1 lg:basis-2/3">
            <PoolInfoCards pool={pool} />
            <HistoricalMetrics
              peggedToken={pool.peggedToken}
              shareToken={pool.shareToken}
              stakingVault={pool.stakingVault}
            />
            <Composition
              chainId={pool.shareToken.chainId}
              shareAddress={pool.shareAddress}
            />
          </div>
          <div className="order-1 lg:sticky lg:top-4 lg:order-2 lg:basis-1/3 lg:self-start">
            <PoolForm />
          </div>
        </div>
      </PoolFormProvider>
    </PageLayout>
  )
}
