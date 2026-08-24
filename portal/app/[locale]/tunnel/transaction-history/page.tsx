'use client'

import { PageLayout } from 'components/pageLayout'
import { PageTitle } from 'components/pageTitle'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { type FilterOptions, TopBar } from './_components/topBar'
import { TransactionHistory } from './_components/transactionHistory'

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
        <TransactionHistory
          filterOption={filterOption}
          setFilterOption={setFilterOption}
        />
      </div>
    </PageLayout>
  )
}

export default Page
