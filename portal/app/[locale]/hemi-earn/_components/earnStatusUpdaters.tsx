'use client'

import { useTranslations } from 'next-intl'

import { useEarnDeliveryWatcher } from '../_hooks/useEarnDeliveryWatcher'

import { EarnSuccessToast } from './earnSuccessToast'

// Mounted in the hemi-earn layout. Drives cross-route polling and Vetro-
// side cache invalidation off a single subscription — `useEarnDeliveryWatcher`
// soft-settles local entries once the subgraph indexes them and invalidates
// pool TVL, user pool position, and the staked-balance card when a request
// transitions to CLAIMED/RECOVERED. The same layout slot renders one
// success toast per kind so they survive navigation between the pool page
// and home.
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
