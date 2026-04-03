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

import { VaultInfoCards } from './vaultInfoCards'
import { VaultNavigation } from './vaultNavigation'

type Props = {
  vaultAddress: string
}

export const VaultPageContent = function ({ vaultAddress }: Props) {
  const router = useRouter()
  const locale = useLocale()
  const [networkType] = useNetworkType()
  const { data: pools, fetchStatus, isPending } = useEarnPools()
  // When `enabled: false` (no vaults on this chain), React Query keeps
  // `isPending: true` forever. `fetchStatus === 'idle'` detects that case so
  // we can still redirect instead of showing the skeleton indefinitely.
  const isLoading = isPending && fetchStatus !== 'idle'

  const pool = pools?.find(
    p =>
      p.vaultAddress.toLowerCase() === (vaultAddress as Address).toLowerCase(),
  )

  const networkTypeRef = useRef(networkType)
  useEffect(
    function redirectOnNetworkChange() {
      if (networkTypeRef.current === networkType) return
      networkTypeRef.current = networkType
      // nuqs defers its URL flush via setTimeout(~50ms). Calling router.push
      // here fires immediately but nuqs's flush overwrites it 50ms later with
      // the vault URL + ?networkType. Instead, we pre-set location.pathname to
      // /hemi-earn via history.pushState *before* nuqs flushes. nuqs then reads
      // the updated pathname and applies ?networkType to the earn page URL,
      // and its own router.replace finishes the navigation — no hard reload needed.
      history.pushState(null, '', `/${locale}/hemi-earn`)
    },
    [locale, networkType],
  )

  useEffect(
    function redirectIfNotFound() {
      if (!isLoading && !pool) {
        router.push(`/hemi-earn${queryStringObjectToString({ networkType })}`)
      }
    },
    [isLoading, networkType, pool, router],
  )

  if (isLoading) {
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
      <VaultNavigation pool={pool} />
      <div className="mt-6">
        <VaultInfoCards pool={pool} />
      </div>
    </PageLayout>
  )
}
