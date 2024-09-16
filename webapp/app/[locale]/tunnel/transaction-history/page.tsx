'use client'

import { PageTitle } from 'components/pageTitle'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'

// using CSR because useWindowSize doesn't work on SSR
const TransactionHistory = dynamic(
  () =>
    import('./_components/transactionHistory').then(
      mod => mod.TransactionHistory,
    ),
  {
    loading: () => <Skeleton className="h-4/5 w-full" />,
    ssr: false,
  },
)

const Page = function () {
  const t = useTranslations('tunnel-page')

  return (
    <>
      <PageTitle
        subtitle={t('transaction-history.subtitle')}
        title={t('transaction-history.title')}
      />
      <TransactionHistory />
    </>
  )
}

export default Page
