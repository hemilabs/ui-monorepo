import { Suspense, useState } from 'react'
import Skeleton from 'react-loading-skeleton'

import { usePoolForm } from '../_context/poolFormContext'
import { useDrawerQueryString } from '../_hooks/useDrawerQueryString'
import { type PoolOperation } from '../_types/operations'

import { Deposit } from './deposit'
import { PoolReview } from './poolReview'
import { Withdraw } from './withdraw'

const SideDrawer = function () {
  const { drawerMode, setDrawerQueryString } = useDrawerQueryString()
  const { depositOperation, withdrawOperation } = usePoolForm()

  if (!drawerMode || (!depositOperation && !withdrawOperation)) {
    return null
  }

  return <PoolReview closeDrawer={() => setDrawerQueryString(null)} />
}

export const PoolForm = function () {
  const { pool, resetSettings, updateSharesInput } = usePoolForm()
  const [activeTab, setActiveTab] = useState<PoolOperation>('deposit')

  const switchToDeposit = function () {
    updateSharesInput('0')
    resetSettings()
    setActiveTab('deposit')
  }

  const switchToWithdraw = function () {
    updateSharesInput('0')
    resetSettings()
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
