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

// `claimDeposit`/`recoverDeposit`/`claimRedeem`/`recoverRedeem` all share this
// signature — a single Hemi Router tx with no approval or quote leg.
type SettleAction = (typeof import('hemi-earn-actions/actions'))['claimDeposit']

type UseSettle = {
  action: SettleAction
  // The token that lands in the wallet on success — caller-supplied because the
  // direction inverts by flow: a deposit claim delivers shares / recover returns
  // the asset; a redeem claim delivers the asset / recover returns the shares.
  deliveredTokenAddress: Address
  // Drives the settlement marker: `CLAIM` (FULFILLED→FINALIZED) vs `RECOVER`
  // (CANCELLED→RECOVERED).
  kind: 'CLAIM' | 'RECOVER'
  // All four settlement actions emit the same shape; `ClaimDepositEvents` is the
  // canonical alias.
  on?: (emitter: EventEmitter<ClaimDepositEvents>) => void
  transaction: EarnTransaction
}

// Shared mutation core for the single-tx claim/recover settlements (deposit and
// redeem). Mirrors the `useWithdraw` scaffolding (wallet client + invalidations)
// without the approval/quote machinery. The settlement state is persisted on the
// local entry (`setSettlement`): flagged failed on revert so the CTA returns as a
// Retry, left pending on success and dropped by the merge once the row is terminal
// (so the CTA doesn't flicker back during the indexing lag).
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
      // `resetQueries` (not `invalidate`) so the manage page shows a fresh value
      // instead of flashing the stale balance: the form usually mounts *after*
      // the mutation (the user clicks "manage" post-settlement), and an
      // invalidated-but-cached entry would render the old number until the
      // background refetch lands.
      queryClient.resetQueries({ queryKey: deliveredBalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: nativeTokenBalanceQueryKey })
      // `resetQueries` (not `removeQueries`) so the `useEarnPositions` observer
      // refetches and the staked-balance card updates — same rationale as
      // `useWithdraw`.
      queryClient.resetQueries({ queryKey: earnPositionsKeyPrefix })
    },
  })
}
