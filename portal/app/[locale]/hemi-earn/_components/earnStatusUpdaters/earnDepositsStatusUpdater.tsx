'use client'

import { useEarnDeliveryWatcher } from '../../_hooks/useEarnDeliveryWatcher'

// Invisible watcher mounted in the hemi-earn layout. Owns the single
// instance of `useEarnDeliveryWatcher`, which:
//   - keeps the polling subscription alive while the user navigates between
//     `/hemi-earn` and `/hemi-earn/pool/[shareAddress]` (react-query dedupes
//     with `<TransactionsTable>` and `<TransactionDrawerContent>`, so no
//     extra network volume);
//   - flips local entries to `settled` once the subgraph indexes them;
//   - invalidates Vetro-side balance queries (TVL, user pool position,
//     staked-balance card) when a deposit transitions to CLAIMED/RECOVERED.
//
// Side effects intentionally live here, NOT inside `useEarnTransactions`,
// so they fire once per polling cycle instead of N times across every
// consumer of the data hook.
export const EarnDepositsStatusUpdater = function () {
  useEarnDeliveryWatcher()
  return null
}
