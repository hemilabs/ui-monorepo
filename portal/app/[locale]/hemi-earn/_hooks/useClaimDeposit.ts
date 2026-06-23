import { type EventEmitter } from 'events'
import { type ClaimDepositEvents } from 'hemi-earn-actions'
import { claimDeposit } from 'hemi-earn-actions/actions'

import { type EarnAsset, type EarnPool, type EarnTransaction } from '../types'

import { useSettle } from './useSettle'

type UseClaimDeposit = {
  asset: EarnAsset
  on?: (emitter: EventEmitter<ClaimDepositEvents>) => void
  pool: EarnPool
  transaction: EarnTransaction
}

// Signs `Router.claimDeposit(requestId)` for a FULFILLED + manual deposit so the
// shares land in the user's wallet (→ FINALIZED).
export const useClaimDeposit = (params: UseClaimDeposit) =>
  useSettle({
    action: claimDeposit,
    deliveredTokenAddress: params.pool.shareAddress,
    kind: 'CLAIM',
    on: params.on,
    transaction: params.transaction,
  })
