'use client'

import { PageTitle } from 'components/pageTitle'
import { useTranslations } from 'next-intl'

import { TransactionsTable } from './transactionsTable'

export const TransactionsSection = function () {
  const t = useTranslations('hemi-earn.transactions')
  return (
    <div className="mt-16 w-full">
      <PageTitle subtitle={t('subtitle')} title={t('title')} />
      <div className="mt-6">
        <TransactionsTable />
      </div>
    </div>
  )
}
