'use client'

import { PageLayout } from 'components/pageLayout'
import dynamic from 'next/dynamic'
import { type ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'

import { InfoCards } from './_components/infoCards'
import { TopSection } from './_components/topSection'
import { useHemiEarnShares } from './_hooks/useHemiEarnShares'

const PoolsListSkeleton = () => (
  <div className="mt-6 flex w-full flex-col gap-4">
    <Skeleton className="md:h-19.5 h-58 w-full rounded-xl" />
    <div className="hidden md:block">
      <Skeleton className="h-19.5 w-full rounded-xl" />
    </div>
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
