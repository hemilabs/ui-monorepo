'use client'

import { useTranslations } from 'next-intl'

import { useEarnDeliveryWatcher } from '../_hooks/useEarnDeliveryWatcher'

import { EarnSuccessToast } from './earnSuccessToast'

// Layout-mounted so polling, soft-settle/cache invalidation, and the success toasts persist across route changes (one subscription for all).
export const EarnStatusUpdaters = function () {
  const t = useTranslations('hemi-earn.pool')
  useEarnDeliveryWatcher()
  return (
    <>
      <EarnSuccessToast kind="DEPOSIT" title={t('deposit-successful')} />
      <EarnSuccessToast kind="REDEEM" title={t('withdraw-successful')} />
    </>
  )
}
