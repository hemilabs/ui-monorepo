'use client'

import { PageLayout } from 'components/pageLayout'
import { useNetworkType } from 'hooks/useNetworkType'
import dynamic from 'next/dynamic'
import { type ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'

import { EarnDisabledTestnet } from './_components/earnDisabledTestnet'
import { InfoCards } from './_components/infoCards'
import { TopSection } from './_components/topSection'
import { TransactionsSection } from './_components/transactionsSection'
import { useHemiEarnShares } from './_hooks/useHemiEarnShares'

const PoolsListSkeleton = () => (
  <div className="mt-6 flex w-full flex-col gap-4">
    <Skeleton className="h-58 w-full rounded-xl md:h-19.5" />
  </div>
)

const PoolsSection = dynamic(
  () => import('./_components/poolsSection').then(mod => mod.PoolsSection),
  {
    loading: () => <PoolsListSkeleton />,
    ssr: false,
  },
)

// Bails out of rendering the data section if the share registry can't be
// resolved. Loading is no longer gated here: each child component (InfoCards,
// PoolsSection) handles its own skeleton state, and the underlying
// `useHemiEarnShares` query is a single shared subscription via react-query
// so concurrent mounts don't fan out.
const TokensGate = function ({ children }: { children: ReactNode }) {
  const { isError } = useHemiEarnShares()
  if (isError) return null
  return <>{children}</>
}

export default function Page() {
  const [networkType] = useNetworkType()
  const isEnabled = networkType !== 'testnet'

  return (
    <PageLayout variant="wide">
      <TopSection />
      {isEnabled ? (
        <TokensGate>
          <InfoCards />
          <PoolsSection />
          <TransactionsSection />
        </TokensGate>
      ) : (
        <EarnDisabledTestnet />
      )}
    </PageLayout>
  )
}
