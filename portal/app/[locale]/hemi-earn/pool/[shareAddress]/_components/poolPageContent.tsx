import { PageLayout } from 'components/pageLayout'
import { useNetworkType } from 'hooks/useNetworkType'
import { useRouter } from 'i18n/navigation'
import { useEffect } from 'react'
import Skeleton from 'react-loading-skeleton'
import { queryStringObjectToString } from 'utils/url'
import { type Address } from 'viem'

import { useEarnPools } from '../../../_hooks/useEarnPools'
import { findPoolByShare } from '../../../_utils/pools'
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
  const [networkType] = useNetworkType()
  const { data: pools, isPending } = useEarnPools()

  const pool = pools
    ? findPoolByShare(pools, shareAddress as Address)
    : undefined

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
          <div className="order-2 flex flex-col gap-4 md:gap-5 lg:order-1 lg:basis-3/5">
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
          <div className="order-1 lg:sticky lg:top-4 lg:order-2 lg:basis-2/5 lg:self-start">
            <PoolForm />
          </div>
        </div>
      </PoolFormProvider>
    </PageLayout>
  )
}
