'use client'

import { PageLayout } from 'components/pageLayout'
import dynamic from 'next/dynamic'
import { type ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'

import { InfoCards, InfoCardsSkeleton } from './_components/infoCards'
import { TopSection } from './_components/topSection'
import { useHemiEarnShares } from './_hooks/useHemiEarnShares'

const PoolsListSkeleton = () => (
  <div className="mt-10 flex w-full flex-col gap-4">
    <Skeleton className="h-19 w-full rounded-xl" />
    <Skeleton className="h-19 w-full rounded-xl" />
  </div>
)

const PoolsSection = dynamic(
  () => import('./_components/poolsSection').then(mod => mod.PoolsSection),
  {
    loading: () => <PoolsListSkeleton />,
    ssr: false,
  },
)

// Gates the page on the first resolution of `useHemiEarnShares`. The hook
// reads each share's pegged-token address from the gateway on-chain, and
// without this gate the InfoCards + PoolsSection would all mount with their
// own `useQueries` subscriptions while that fetch is still in flight,
// fanning out across 5+ sibling consumers and locking the main thread.
// Mounting only after the gate releases means children read the resolved
// pegged-token address from the react-query cache synchronously.
const TokensGate = function ({ children }: { children: ReactNode }) {
  const { isError, isPending } = useHemiEarnShares()
  if (isError) return null
  if (isPending) {
    return (
      <>
        <InfoCardsSkeleton />
        <PoolsListSkeleton />
      </>
    )
  }
  return <>{children}</>
}

export default function Page() {
  return (
    <PageLayout variant="wide">
      <TopSection />
      <TokensGate>
        <InfoCards />
        <PoolsSection />
      </TokensGate>
    </PageLayout>
  )
}
