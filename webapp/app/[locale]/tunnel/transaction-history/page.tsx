'use client'

import dynamic from 'next/dynamic'
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

const Page = () => <TransactionHistory />

export default Page
