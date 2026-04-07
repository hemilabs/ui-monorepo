'use client'

import { PageLayout } from 'components/pageLayout'
import dynamic from 'next/dynamic'
import { type ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'

import { InfoCards } from './_components/infoCards'
import { TopSection } from './_components/topSection'
import { useHemiEarnTokens } from './_hooks/useHemiEarnTokens'

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

const TokensGate = function ({ children }: { children: ReactNode }) {
  const { data, isError } = useHemiEarnTokens()
  if (isError) return null
  if (data) return <>{children}</>
  return <EarnTableSkeleton />
}

export default function Page() {
  return (
    <PageLayout variant="wide">
      <TopSection />
      <InfoCards />
      <TokensGate>
        <EarnTable />
      </TokensGate>
    </PageLayout>
  )
}
