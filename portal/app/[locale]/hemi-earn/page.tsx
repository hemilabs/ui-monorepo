import { Button } from 'components/button'
import { WarningIcon } from 'components/icons/warningIcon'
import { InformationBox } from 'components/informationBox'
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
      <div className="size-full" role="alert">
        <InformationBox
          actions={
            <Button onClick={() => refetch()} size="xSmall" type="button">
              {t('common.try-again')}
            </Button>
          }
          icon={<WarningIcon className="text-orange-600" />}
          subtitle={t('common.unexpected-error')}
          title={t('hemi-earn.could-not-load')}
        />
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
