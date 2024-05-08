'use client'
import { useActiveTab } from './_hooks/useActiveTab'
import TransactionHistory from './transaction-history/table'
import Tunnel from './tunnel'

export default function Page() {
  const activeTab = useActiveTab()

  return (
    <>
      {activeTab == null && <Tunnel />}
      {activeTab === 'history' && <TransactionHistory />}
    </>
  )
}
