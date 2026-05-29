'use client'

import { useEarnDeliveryWatcher } from '../_hooks/useEarnDeliveryWatcher'

// Invisible watcher mounted in the hemi-earn layout. Drives cross-route
// polling and Vetro-side cache invalidation off a single subscription —
// `useEarnDeliveryWatcher` flips local entries to `settled` once the
// subgraph indexes them and invalidates pool TVL, user pool position, and
// the staked-balance card when a deposit transitions to CLAIMED/RECOVERED.
//
// When withdraw lands, add a `useWithdrawDeliveryWatcher()` call right
// alongside — no extra component layer needed since each watcher is a
// single hook call.
export const EarnStatusUpdaters = function () {
  useEarnDeliveryWatcher()
  return null
}
