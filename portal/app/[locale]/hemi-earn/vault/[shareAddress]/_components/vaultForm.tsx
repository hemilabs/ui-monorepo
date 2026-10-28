import { Suspense, useState } from 'react'
import Skeleton from 'react-loading-skeleton'

import { useVaultForm } from '../_context/vaultFormContext'
import { useDrawerQueryString } from '../_hooks/useDrawerQueryString'
import { type VaultOperation } from '../_types/operations'

import { Deposit } from './deposit'
import { VaultReview } from './vaultReview'
import { Withdraw } from './withdraw'

const SideDrawer = function () {
  const { drawerMode, setDrawerQueryString } = useDrawerQueryString()
  const { depositOperation, withdrawOperation } = useVaultForm()

  if (!drawerMode || (!depositOperation && !withdrawOperation)) {
    return null
  }

  return <VaultReview closeDrawer={() => setDrawerQueryString(null)} />
}

export const VaultForm = function () {
  const { vault, resetSettings, updateSharesInput } = useVaultForm()
  const [activeTab, setActiveTab] = useState<VaultOperation>('deposit')

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

  if (!vault.shareToken) {
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
