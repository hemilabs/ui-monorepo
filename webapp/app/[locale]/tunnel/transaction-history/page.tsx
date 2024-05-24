'use client'

import { TunnelHistoryContext } from 'context/tunnelHistoryContext'
import dynamic from 'next/dynamic'
import { useContext, useEffect, useState } from 'react'
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

export default function Page() {
  // We want to resume sync on the initial render of the page
  // using state because otherwise, the effect fires multiple times and gets stuck on a loop!
  const [initialRender, setInitialRender] = useState(true)
  const { resumeSync } = useContext(TunnelHistoryContext)

  useEffect(
    function resumeSyncingOfTunnelHistory() {
      if (initialRender) {
        resumeSync()
        setInitialRender(false)
      }
    },
    [initialRender, resumeSync, setInitialRender],
  )

  return <TransactionHistory />
}
