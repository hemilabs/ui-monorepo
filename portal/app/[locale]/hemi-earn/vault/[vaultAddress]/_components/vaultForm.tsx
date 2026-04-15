'use client'

import { ToastLoader } from 'components/toast/toastLoader'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Suspense, useState } from 'react'
import Skeleton from 'react-loading-skeleton'

import { useVaultForm } from '../_context/vaultFormContext'
import { useDrawerVaultQueryString } from '../_hooks/useDrawerVaultQueryString'
import { VaultDepositStatus } from '../_types/vaultOperations'
import { VaultWithdrawStatus } from '../_types/vaultOperations'

import { Deposit } from './deposit'
import { VaultReview } from './vaultReview'
import { Withdraw } from './withdraw'

const VaultToast = dynamic(
  () => import('./vaultToast').then(mod => mod.VaultToast),
  {
    loading: () => <ToastLoader />,
    ssr: false,
  },
)

type ActiveTab = 'deposit' | 'withdraw'

const SideDrawer = function () {
  const { drawerMode, setDrawerQueryString } = useDrawerVaultQueryString()
  const { depositOperation, withdrawOperation } = useVaultForm()

  if (!drawerMode || (!depositOperation && !withdrawOperation)) {
    return null
  }

  return <VaultReview closeDrawer={() => setDrawerQueryString(null)} />
}

export const VaultForm = function () {
  const { depositOperation, pool, updateInput, withdrawOperation } =
    useVaultForm()
  const t = useTranslations('hemi-earn.vault')
  const [activeTab, setActiveTab] = useState<ActiveTab>('deposit')

  const switchToDeposit = function () {
    updateInput('0')
    setActiveTab('deposit')
  }

  const switchToWithdraw = function () {
    updateInput('0')
    setActiveTab('withdraw')
  }

  if (!pool.token) {
    return (
      <Skeleton
        className="min-h-72 rounded-2xl"
        containerClassName="flex justify-center"
      />
    )
  }

  const showDepositToast =
    depositOperation?.status === VaultDepositStatus.DEPOSIT_TX_CONFIRMED &&
    depositOperation.transactionHash

  const showWithdrawToast =
    withdrawOperation?.status === VaultWithdrawStatus.WITHDRAW_TX_CONFIRMED &&
    withdrawOperation.transactionHash

  return (
    <>
      {showDepositToast && (
        <VaultToast
          title={t('deposit-successful')}
          transactionHash={depositOperation.transactionHash!}
        />
      )}
      {showWithdrawToast && (
        <VaultToast
          title={t('withdraw-successful')}
          transactionHash={withdrawOperation.transactionHash!}
        />
      )}
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
