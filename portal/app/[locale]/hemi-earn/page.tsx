import { Button } from 'components/button'
import { lazyWithFallback } from 'components/lazyWithFallback'
import { PageLayout } from 'components/pageLayout'
import { type ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useTranslations } from 'use-intl'

import { InfoCards } from './_components/infoCards'
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

// Shows an error card with a retry button if the share registry can't be
// resolved, instead of hiding the data section. Loading is no longer gated
// here: each child component (InfoCards,
// PoolsSection) handles its own skeleton state, and the underlying
// `useHemiEarnShares` query is a single shared subscription via react-query
// so concurrent mounts don't fan out.
const TokensGate = function ({ children }: { children: ReactNode }) {
  const { isError, refetch } = useHemiEarnShares()
  const t = useTranslations()
  if (isError)
    return (
      <div
        className="mt-6 flex w-full flex-col items-center gap-4 rounded-xl border border-neutral-200 p-8 text-center"
        role="alert"
      >
        <p className="font-medium">{t('common.unexpected-error')}</p>
        <Button onClick={() => refetch()} size="small" type="button">
          {t('common.try-again')}
        </Button>
      </div>
    )
  return <>{children}</>
}

export const HemiEarnPage = () => (
  <PageLayout variant="wide">
    <TopSection />
    <TokensGate>
      <InfoCards />
      <PoolsSection />
      <TransactionsSection />
    </TokensGate>
  </PageLayout>
)
