'use client'

import { Suspense } from 'react'

import { useActiveTab } from './_hooks/useActiveTab'
import TransactionHistory from './transaction-history/table'
import Tunnel from './tunnel'

function Container() {
  const activeTab = useActiveTab()

  return (
    <>
      {activeTab == null && <Tunnel />}
      {activeTab === 'history' && <TransactionHistory />}
    </>
  )
}

export default function Page() {
  return (
    <Suspense>
      <Container />
    </Suspense>
  )
}
