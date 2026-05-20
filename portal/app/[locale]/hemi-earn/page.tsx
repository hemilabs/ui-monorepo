'use client'

import { PageLayout } from 'components/pageLayout'
import dynamic from 'next/dynamic'
import { type ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'

import { InfoCards, InfoCardsSkeleton } from './_components/infoCards'
import { TopSection } from './_components/topSection'
import { useHemiEarnShares } from './_hooks/useHemiEarnShares'

const EarnTableSkeleton = () => (
  <div className="mt-10 w-full">
    <div className="flex w-full gap-x-2 md:w-fit">
      <div className="flex-1 md:w-16 md:flex-none">
        <Skeleton className="h-7 w-full rounded-md" />
      </div>
      <div className="flex-1 md:w-28 md:flex-none">
        <Skeleton className="h-7 w-full rounded-md" />
      </div>
    </div>
    <Skeleton className="h-17 mt-4 w-full rounded-xl" />
  </div>
)

// Dynamically load the table because the column order depends on viewport size
// so, if we don't do this, there will be a very visible layout shift
const EarnTable = dynamic(
  () => import('./_components/earnTable').then(mod => mod.EarnTable),
  {
    loading: () => <EarnTableSkeleton />,
    ssr: false,
  },
)

// Gates the page on the first resolution of `useHemiEarnShares`. The hook
// reads each share's pegged-token address from the gateway on-chain, and
// without this gate the InfoCards + EarnTable would all mount with their
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
        <EarnTableSkeleton />
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
        <EarnTable />
      </TokensGate>
    </PageLayout>
  )
}
