import { type EventEmitter } from 'events'
import { type ClaimRedeemEvents } from 'hemi-earn-actions'
import { claimRedeem } from 'hemi-earn-actions/actions'

import { type EarnAsset, type EarnPool, type EarnTransaction } from '../types'

import { useSettle } from './useSettle'

type UseClaimRedeem = {
  asset: EarnAsset
  on?: (emitter: EventEmitter<ClaimRedeemEvents>) => void
  pool: EarnPool
  transaction: EarnTransaction
}

// Signs `Router.claimRedeem(requestId)` for a FULFILLED + manual redeem so the
// underlying asset (funds) lands in the user's wallet (→ FINALIZED).
export const useClaimRedeem = (params: UseClaimRedeem) =>
  useSettle({
    action: claimRedeem,
    deliveredTokenAddress: params.asset.address,
    kind: 'CLAIM',
    on: params.on,
    transaction: params.transaction,
  })
