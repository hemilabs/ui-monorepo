'use client'

import { Suspense, useState } from 'react'
import Skeleton from 'react-loading-skeleton'

import { usePoolForm } from '../_context/poolFormContext'
import { useDrawerQueryString } from '../_hooks/useDrawerQueryString'

import { Deposit } from './deposit'
import { PoolReview } from './poolReview'
import { Withdraw } from './withdraw'

type ActiveTab = 'deposit' | 'withdraw'

const SideDrawer = function () {
  const { drawerMode, setDrawerQueryString } = useDrawerQueryString()
  const { depositOperation, withdrawOperation } = usePoolForm()

  if (!drawerMode || (!depositOperation && !withdrawOperation)) {
    return null
  }

  return <PoolReview closeDrawer={() => setDrawerQueryString(null)} />
}

export const PoolForm = function () {
  const { pool, updateInput } = usePoolForm()
  const [activeTab, setActiveTab] = useState<ActiveTab>('deposit')

  const switchToDeposit = function () {
    updateInput('0')
    setActiveTab('deposit')
  }

  const switchToWithdraw = function () {
    updateInput('0')
    setActiveTab('withdraw')
  }

  if (!pool.shareToken) {
    return (
      <Skeleton
        className="min-h-72 rounded-2xl"
        containerClassName="flex justify-center"
      />
    )
  }

  return (
    <>
      {activeTab === 'deposit' ? (
        <Deposit onSwitchToWithdraw={switchToWithdraw} />
      ) : (
        <Withdraw onSwitchToDeposit={switchToDeposit} />
      )}
      <Suspense>
        <SideDrawer />
      </Suspense>
    </>
  )
}
