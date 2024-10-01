'use client'

import { PageTitle } from 'components/pageTitle'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Skeleton from 'react-loading-skeleton'

import { type FilterOptions, TopBar } from './_components/topBar'

// using CSR because useWindowSize doesn't work on SSR
const TransactionHistory = dynamic(
  () =>
    import('./_components/transactionHistory').then(
      mod => mod.TransactionHistory,
    ),
  {
    loading: () => (
      <Skeleton className="h-80 w-full rounded-2xl md:h-[500px]" />
    ),
    ssr: false,
  },
)

const Page = function () {
  const [filterOption, setFilterOption] = useState<FilterOptions>('all')
  const t = useTranslations('tunnel-page')

  return (
    <>
      <PageTitle
        subtitle={t('transaction-history.subtitle')}
        title={t('transaction-history.title')}
      />
      <div className="rounded-2.5xl text-ms mt-6 bg-neutral-100 p-1 font-medium leading-5 md:mt-8">
        <TopBar
          filterOption={filterOption}
          onFilterOptionChange={setFilterOption}
        />
        <TransactionHistory filterOption={filterOption} />
      </div>
    </>
  )
}

export default Page
