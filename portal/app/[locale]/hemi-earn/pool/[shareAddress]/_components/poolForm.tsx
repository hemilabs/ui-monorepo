'use client'

import { ToastLoader } from 'components/toast/toastLoader'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Suspense, useState } from 'react'
import Skeleton from 'react-loading-skeleton'

import { usePoolForm } from '../_context/poolFormContext'
import { useDrawerQueryString } from '../_hooks/useDrawerQueryString'
import { DepositStatus } from '../_types/operations'
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
  const { depositOperation, pool, updateInput, withdrawOperation } =
    usePoolForm()
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

  const showDepositToast =
    depositOperation?.status === DepositStatus.DEPOSIT_TX_CONFIRMED &&
    depositOperation.transactionHash

  const showWithdrawToast =
    withdrawOperation?.status === WithdrawStatus.WITHDRAW_TX_CONFIRMED &&
    withdrawOperation.transactionHash

  return (
    <>
      {showDepositToast && (
        <PoolToast
          chainId={pool.shareToken.chainId}
          title={t('deposit-submitted')}
          transactionHash={depositOperation.transactionHash!}
        />
      )}
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
