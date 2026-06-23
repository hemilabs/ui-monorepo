import { type EventEmitter } from 'events'
import { type RecoverDepositEvents } from 'hemi-earn-actions'
import { recoverDeposit } from 'hemi-earn-actions/actions'

import { type EarnAsset, type EarnPool, type EarnTransaction } from '../types'

import { useSettle } from './useSettle'

type UseRecoverDeposit = {
  asset: EarnAsset
  on?: (emitter: EventEmitter<RecoverDepositEvents>) => void
  pool: EarnPool
  transaction: EarnTransaction
}

// Signs `Router.recoverDeposit(requestId)` for a CANCELLED + manual deposit so
// the original asset returns to the user's wallet (→ RECOVERED).
export const useRecoverDeposit = (params: UseRecoverDeposit) =>
  useSettle({
    action: recoverDeposit,
    deliveredTokenAddress: params.asset.address,
    kind: 'RECOVER',
    on: params.on,
    transaction: params.transaction,
  })
