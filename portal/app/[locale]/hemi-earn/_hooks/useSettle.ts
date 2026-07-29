import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { useUpdateNativeBalanceAfterReceipt } from '@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type EventEmitter } from 'events'
import { type ClaimDepositEvents } from 'hemi-earn-actions'
import { hemi } from 'hemi-viem'
import { getTokenBalanceQueryKey } from 'hooks/useBalance'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { type Address } from 'viem'
import { useAccount } from 'wagmi'

import { earnPositionsKeyPrefix } from '../_fetchers/fetchEarnPositions'
import { earnTransactionsKeyPrefix } from '../_fetchers/fetchEarnTransactions'
import { type EarnTransaction } from '../types'

import { useLocalEarnOperations } from './useLocalEarnOperations'

// The four settlement actions share this signature (one Hemi Router tx, no approval/quote leg).
type SettleAction = (typeof import('hemi-earn-actions/actions'))['claimDeposit']

type UseSettle = {
  action: SettleAction
  // Token that lands on success; caller-supplied because the direction inverts by flow
  // (deposit claim → shares, redeem claim → asset; recover flips each).
  deliveredTokenAddress: Address
  // Settlement marker: CLAIM (FULFILLED→FINALIZED) vs RECOVER (CANCELLED→RECOVERED).
  kind: 'CLAIM' | 'RECOVER'
  // All four actions emit the same shape; ClaimDepositEvents is the canonical alias.
  on?: (emitter: EventEmitter<ClaimDepositEvents>) => void
  transaction: EarnTransaction
}

// Shared core for the single-tx claim/recover settlements. Marker on the local entry:
// failed on revert (CTA becomes Retry), pending on success then dropped once terminal (no flicker during indexing lag).
export const useSettle = function ({
  action,
  deliveredTokenAddress,
  kind,
  on,
  transaction,
}: UseSettle) {
  const { address } = useAccount()
  const { hemiWalletClient } = useHemiWalletClient()
  const ensureConnectedTo = useEnsureConnectedTo()
  const queryClient = useQueryClient()
  const { setSettlement } = useLocalEarnOperations()
  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    hemi.id,
  )
  const { queryKey: nativeTokenBalanceQueryKey } = useNativeBalance(hemi.id)

  const { requestId } = transaction

  const deliveredBalanceQueryKey = getTokenBalanceQueryKey({
    account: address,
    chainId: hemi.id,
    tokenAddress: deliveredTokenAddress,
  })

  return useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error('No account connected')
      }

      await ensureConnectedTo(hemi.id)

      const { emitter, promise } = action({
        account: address,
        requestId: BigInt(requestId),
        walletClient: hemiWalletClient!,
      })

      // Keyed by the request tx (requestTxHash = the local entry's initiateTxHash).
      const fail = () =>
        setSettlement(transaction.requestTxHash, { failed: true, kind })

      emitter.on('user-signed-tx', function (txHash) {
        setSettlement(transaction.requestTxHash, {
          failed: false,
          kind,
          txHash,
        })
      })
      emitter.on('tx-transaction-succeeded', function (receipt) {
        updateNativeBalanceAfterFees(receipt)
      })
      emitter.on('tx-transaction-reverted', function (receipt) {
        fail()
        updateNativeBalanceAfterFees(receipt)
      })
      emitter.on('tx-failed', fail)
      emitter.on('tx-failed-validation', fail)
      emitter.on('user-signing-tx-error', fail)
      emitter.on('unexpected-error', fail)

      // Caller listens for user-signed-tx to redirect the drawer.
      on?.(emitter)

      return promise
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: earnTransactionsKeyPrefix })
      // resetQueries (not invalidate): the manage form usually mounts after the mutation,
      // so an invalidated-but-cached entry would flash the stale balance.
      queryClient.resetQueries({ queryKey: deliveredBalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: nativeTokenBalanceQueryKey })
      // resetQueries (not removeQueries) so the useEarnPositions observer refetches the staked-balance card.
      queryClient.resetQueries({ queryKey: earnPositionsKeyPrefix })
    },
  })
}
