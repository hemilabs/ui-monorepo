import { type EventEmitter } from 'events'
import { type RecoverRedeemEvents } from 'hemi-earn-actions'
import { recoverRedeem } from 'hemi-earn-actions/actions'

import { type EarnAsset, type EarnPool, type EarnTransaction } from '../types'

import { useSettle } from './useSettle'

type UseRecoverRedeem = {
  asset: EarnAsset
  on?: (emitter: EventEmitter<RecoverRedeemEvents>) => void
  pool: EarnPool
  transaction: EarnTransaction
}

// Signs `Router.recoverRedeem(requestId)` for a CANCELLED + manual redeem so the
// shares return to the user's wallet (→ RECOVERED).
export const useRecoverRedeem = (params: UseRecoverRedeem) =>
  useSettle({
    action: recoverRedeem,
    deliveredTokenAddress: params.pool.shareAddress,
    kind: 'RECOVER',
    on: params.on,
    transaction: params.transaction,
  })
