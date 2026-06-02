'use client'

import { useEarnDeliveryWatcher } from '../_hooks/useEarnDeliveryWatcher'

import { DepositSuccessToast } from './depositSuccessToast'

// Mounted in the hemi-earn layout. Drives cross-route polling and Vetro-
// side cache invalidation off a single subscription — `useEarnDeliveryWatcher`
// removes local entries once the subgraph indexes them and invalidates
// pool TVL, user pool position, and the staked-balance card when a deposit
// transitions to CLAIMED/RECOVERED. The same layout slot renders the
// success toast so it survives navigation between the pool page and home.
//
// When withdraw lands, add a `useWithdrawDeliveryWatcher()` call (and a
// sibling toast if needed) right alongside.
export const EarnStatusUpdaters = function () {
  useEarnDeliveryWatcher()
  return <DepositSuccessToast />
}
