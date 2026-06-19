import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { useUpdateNativeBalanceAfterReceipt } from '@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type EventEmitter } from 'events'
import { type ClaimDepositEvents } from 'hemi-earn-actions'
import { hemi } from 'hemi-viem'
import { getTokenBalanceQueryKey } from 'hooks/useBalance'
import { useAccount, useConfig } from 'wagmi'
import { getWalletClient } from 'wagmi/actions'

import { earnPositionsKeyPrefix } from '../_fetchers/fetchEarnPositions'
import { earnTransactionsKeyPrefix } from '../_fetchers/fetchEarnTransactions'
import { type EarnAsset, type EarnPool, type EarnTransaction } from '../types'

import { useLocalEarnOperations } from './useLocalEarnOperations'

// Both `claimDeposit` and `recoverDeposit` share this exact signature.
type SettleAction = (typeof import('hemi-earn-actions/actions'))['claimDeposit']

type UseSettleDeposit = {
  // The `hemi-earn-actions` wallet action to run (`claimDeposit` /
  // `recoverDeposit`). Both finalize a single Hemi Router tx with no approval
  // or quote leg.
  action: SettleAction
  asset: EarnAsset
  // Drives which delivered-token balance to refresh and the settlement kind:
  // claim delivers shares, recover returns the original asset.
  kind: 'CLAIM' | 'RECOVER'
  on?: (emitter: EventEmitter<ClaimDepositEvents>) => void
  pool: EarnPool
  transaction: EarnTransaction
}

// Shared mutation core for the two single-tx deposit settlements. Mirrors the
// `useWithdraw` scaffolding (wallet client + invalidations) but without the
// approval/quote machinery. The settlement state is persisted on the local
// entry (`setSettlement`): flagged failed on revert so the CTA returns as a
// Retry, left pending on success and dropped by the merge once the row is
// terminal (so the CTA doesn't flicker back during the indexing lag).
export const useSettleDeposit = function ({
  action,
  asset,
  kind,
  on,
  pool,
  transaction,
}: UseSettleDeposit) {
  const { address } = useAccount()
  const config = useConfig()
  const ensureConnectedTo = useEnsureConnectedTo()
  const queryClient = useQueryClient()
  const { setSettlement } = useLocalEarnOperations()
  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    hemi.id,
  )
  const { queryKey: nativeTokenBalanceQueryKey } = useNativeBalance(hemi.id)

  const { requestId } = transaction

  // Claim drops shares into the user's wallet; recover returns the original
  // asset. Refresh whichever lands.
  const deliveredBalanceQueryKey = getTokenBalanceQueryKey({
    account: address,
    chainId: hemi.id,
    tokenAddress: kind === 'CLAIM' ? pool.shareAddress : asset.address,
  })

  return useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error('No account connected')
      }

      await ensureConnectedTo(hemi.id)

      const walletClient = await getWalletClient(config, { chainId: hemi.id })

      const { emitter, promise } = action({
        account: address,
        requestId: BigInt(requestId),
        walletClient,
      })

      // Any failure flags the settlement so the drawer offers a Retry. On
      // success the marker is left pending — the merge drops it once the row is
      // FINALIZED/RECOVERED, so the CTA stays suppressed through the indexing
      // lag instead of re-appearing while the status is still FULFILLED/
      // CANCELLED. Keyed by the request tx (`requestTxHash` = the local entry's
      // `initiateTxHash`).
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

      // Caller hook (e.g. the table CTA) listens for `user-signed-tx` to
      // redirect the drawer.
      on?.(emitter)

      return promise
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: earnTransactionsKeyPrefix })
      queryClient.invalidateQueries({ queryKey: deliveredBalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: nativeTokenBalanceQueryKey })
      // `resetQueries` (not `removeQueries`) so the `useEarnPositions` observer
      // refetches and the staked-balance card updates — same rationale as
      // `useWithdraw`.
      queryClient.resetQueries({ queryKey: earnPositionsKeyPrefix })
    },
  })
}
