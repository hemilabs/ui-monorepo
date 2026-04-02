'use client'

import { PageLayout } from 'components/pageLayout'
import { useRouter } from 'i18n/navigation'
import { useEffect } from 'react'
import Skeleton from 'react-loading-skeleton'
import { type Address } from 'viem'

import { useEarnPools } from '../../../_hooks/useEarnPools'

import { VaultInfoCards } from './vaultInfoCards'
import { VaultNavigation } from './vaultNavigation'

type Props = {
  vaultAddress: string
}

export const VaultPageContent = function ({ vaultAddress }: Props) {
  const router = useRouter()
  const { data: pools, isPending } = useEarnPools()

  const pool = pools?.find(
    p =>
      p.vaultAddress.toLowerCase() === (vaultAddress as Address).toLowerCase(),
  )

  useEffect(
    function redirectIfNotFound() {
      if (!isPending && !pool) {
        router.push('/hemi-earn')
      }
    },
    [isPending, pool, router],
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
      <VaultNavigation pool={pool} />
      <div className="mt-6">
        <VaultInfoCards pool={pool} />
      </div>
    </PageLayout>
  )
}
