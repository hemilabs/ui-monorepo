import { lazyWithFallback } from 'components/lazyWithFallback'
import { PageLayout } from 'components/pageLayout'
import { type ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'

import { EarnFooter } from './_components/earnFooter'
import { InfoCards } from './_components/infoCards'
import { OperatorBanner } from './_components/operatorDisclosure'
import { TopSection } from './_components/topSection'
import { TransactionsSection } from './_components/transactionsSection'
import { useHemiEarnShares } from './_hooks/useHemiEarnShares'

const PoolsListSkeleton = () => (
  <div className="mt-6 flex w-full flex-col gap-4">
    <Skeleton className="h-58 w-full rounded-xl md:h-19.5" />
  </div>
)

const PoolsSection = lazyWithFallback(
  () =>
    import('./_components/poolsSection').then(mod => ({
      default: mod.PoolsSection,
    })),
  <PoolsListSkeleton />,
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

export const HemiEarnPage = () => (
  <PageLayout variant="wide">
    <div className="md:pb-32">
      <TopSection />
      <div className="mb-6">
        <OperatorBanner />
      </div>
      <TokensGate>
        <InfoCards />
        <PoolsSection />
        <TransactionsSection />
      </TokensGate>
    </div>
    <EarnFooter />
  </PageLayout>
)
