'use client'

import { ToastLoader } from 'components/toast/toastLoader'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Suspense, useState } from 'react'
import Skeleton from 'react-loading-skeleton'

import { usePoolForm } from '../_context/poolFormContext'
import { useDrawerQueryString } from '../_hooks/useDrawerQueryString'
import { WithdrawStatus } from '../_types/operations'

import { Deposit } from './deposit'
import { PoolReview } from './poolReview'
import { Withdraw } from './withdraw'

const PoolToast = dynamic(
  () => import('./poolToast').then(mod => mod.PoolToast),
  {
    loading: () => <ToastLoader />,
    ssr: false,
  },
)

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
  const { pool, updateInput, withdrawOperation } = usePoolForm()
  const t = useTranslations('hemi-earn.pool')
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

  // Deposit success toast is rendered at the hemi-earn layout level via
  // `<DepositSuccessToast>` so it fires off the subgraph CLAIMED transition
  // (the full cross-chain flow's completion), not at request-deposit mined.
  const showWithdrawToast =
    withdrawOperation?.status === WithdrawStatus.WITHDRAW_TX_CONFIRMED &&
    withdrawOperation.transactionHash

  return (
    <>
      {showWithdrawToast && (
        <PoolToast
          chainId={pool.shareToken.chainId}
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
