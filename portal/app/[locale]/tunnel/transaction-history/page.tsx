'use client'

import { PageLayout } from 'components/pageLayout'
import { PageTitle } from 'components/pageTitle'
import { useTranslations } from 'next-intl'
import { lazy, Suspense, useState } from 'react'
import Skeleton from 'react-loading-skeleton'

import { type FilterOptions, TopBar } from './_components/topBar'

const TransactionHistory = lazy(() =>
  import('./_components/transactionHistory').then(mod => ({
    default: mod.TransactionHistory,
  })),
)

const Page = function () {
  const [filterOption, setFilterOption] = useState<FilterOptions>({
    action: 'all',
    operation: 'all',
    timeDesc: true,
    type: 'all',
  })
  const t = useTranslations('tunnel-page')

  return (
    <PageLayout variant="wide">
      <PageTitle
        subtitle={t('transaction-history.subtitle')}
        title={t('transaction-history.title')}
      />
      <div className="mt-6 flex flex-col gap-y-4 text-sm font-medium md:mt-8">
        <TopBar
          filterOption={filterOption}
          onFilterOptionChange={setFilterOption}
        />
        <Suspense
          fallback={
            // Mirrors the table's own height and radius so the first paint matches it
            <Skeleton
              className="block h-[56dvh] w-full rounded-lg md:min-h-136"
              containerClassName="block"
            />
          }
        >
          <TransactionHistory
            filterOption={filterOption}
            setFilterOption={setFilterOption}
          />
        </Suspense>
      </div>
    </PageLayout>
  )
}

export default Page
