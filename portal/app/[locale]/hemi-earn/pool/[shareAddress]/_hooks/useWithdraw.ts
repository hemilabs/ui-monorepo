import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { useUpdateNativeBalanceAfterReceipt } from '@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import {
  type RequestRedeemEvents,
  getHemiEarnRouterAddress,
} from 'hemi-earn-actions'
import { requestRedeem } from 'hemi-earn-actions/actions'
import { getTokenBalanceQueryKey } from 'hooks/useBalance'
import { useNetworkType } from 'hooks/useNetworkType'
import { buildAllowanceQueryKey } from 'utils/allowanceQueryKey'
import { unixNowTimestamp } from 'utils/time'
import { type Hash } from 'viem'
import { useAccount, useConfig } from 'wagmi'
import { getWalletClient } from 'wagmi/actions'

import { earnPositionsKeyPrefix } from '../../../_fetchers/fetchEarnPositions'
import { earnTvlQueryKey } from '../../../_hooks/useEarnTvl'
import { useLocalEarnOperations } from '../../../_hooks/useLocalEarnOperations'
import { type EarnAsset, type EarnPool } from '../../../types'
import { type WithdrawOperation, WithdrawStatus } from '../_types/operations'

import { useDrawerQueryString } from './useDrawerQueryString'
import { getUserPoolBalanceQueryKey } from './useUserPoolBalance'

type UseWithdraw = {
  // User-entered withdraw amount in `selectedAsset` units. Drives the
  // optimistic TVL/balance updates after the redeem mines.
  amount: bigint
  // Slippage-protected minimum the caller expects to receive on
  // fulfillment, in `selectedAsset` units. Enforced on the remote chain;
  // locked at request time and frozen across the ~7d cooldown.
  assetsOutMin: bigint
  callbackFee: bigint
  // Resolved by the caller via `useQuoteRedeem`, which mirrors what the
  // Agent computes on Ethereum (`!cooldownEnabled || whitelisted`). The
  // request body and the Router's gas reservation must agree on this; a
  // mismatch causes the Agent to bounce the request as cancel.
  isInstant: boolean
  on?: (emitter: EventEmitter<RequestRedeemEvents>) => void
  // Pegged-token amount that will leave `totalAssets()` when these shares
  // are redeemed. Computed by the caller (the withdraw drawer) alongside
  // the asset→shares conversion in `useAssetsToShares`. Pass `0n` while
  // the preview is pending; `onSettled` invalidation reconciles.
  peggedAmount: bigint
  pool: EarnPool
  // Set by retry callers when the prior attempt had a successful approval
  // (allowance is still on-chain, so `requestRedeem` won't emit
  // `user-signed-approval` again). Carried forward into the new local-store
  // entry so the historical drawer keeps surfacing the approval step.
  priorApprovalTxHash?: Hash
  selectedAsset: EarnAsset
  // Pre-converted share amount in shareToken units. Computed by the caller
  // (the withdraw drawer) via `convertToShares` so the off-chain input flow
  // stays close to the asset-unit UX while this hook stays focused on the
  // on-chain submission.
  shares: bigint
  // Set by retry callers: the `initiateTxHash` of the specific prior FAILED
  // attempt being replaced. Once the new withdraw is signed, that entry is
  // flagged `settled` so the table doesn't show the old failure alongside
  // the new attempt.
  supersedesInitiateTxHash?: Hash
  updateWithdrawOperation: (payload?: WithdrawOperation) => void
}

export const useWithdraw = function ({
  amount,
  assetsOutMin,
  callbackFee,
  isInstant,
  on,
  peggedAmount,
  pool,
  priorApprovalTxHash,
  selectedAsset,
  shares,
  supersedesInitiateTxHash,
  updateWithdrawOperation,
}: UseWithdraw) {
  const { setDrawerQueryString } = useDrawerQueryString()
  const { address } = useAccount()
  const chainId = selectedAsset.token.chainId
  const config = useConfig()
  const ensureConnectedTo = useEnsureConnectedTo()
  const queryClient = useQueryClient()
  const [networkType] = useNetworkType()
  const routerAddress = getHemiEarnRouterAddress()
  // Requires <LocalEarnOperationsProvider> upstream (mounted in the
  // hemi-earn layout). Hook throws at runtime if used outside it.
  const { markSettledByInitiateTxHash, upsertLocalOperation } =
    useLocalEarnOperations()

  const tokenBalanceQueryKey = getTokenBalanceQueryKey({
    account: address,
    chainId,
    tokenAddress: selectedAsset.address,
  })

  const shareBalanceQueryKey = getTokenBalanceQueryKey({
    account: address,
    chainId,
    tokenAddress: pool.shareAddress,
  })

  const { queryKey: nativeTokenBalanceQueryKey } = useNativeBalance(chainId)

  const updateNativeBalanceAfterFees =
    useUpdateNativeBalanceAfterReceipt(chainId)

  const allowanceQueryKey = buildAllowanceQueryKey({
    chainId,
    owner: address,
    spender: routerAddress,
    tokenAddress: pool.shareAddress,
  })

  const userPoolBalanceQueryKey = getUserPoolBalanceQueryKey({
    account: address,
    assetAddress: selectedAsset.address,
    chainId,
    shareAddress: pool.shareAddress,
  })

  const userPoolBalanceQueryKeyPrefix = getUserPoolBalanceQueryKey({
    account: address,
    chainId,
    shareAddress: pool.shareAddress,
  })

  const poolTotalAssetsQueryKey = earnTvlQueryKey({
    networkType,
    shareAddress: pool.shareAddress,
  })

  return useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error('No account connected')
      }

      await ensureConnectedTo(chainId)

      const walletClient = await getWalletClient(config, { chainId })

      // Local-store entries are created at two points:
      //   1. `user-signed-approval` — captures `approvalTxHash` so a future
      //      historical drawer can later render the approval step (the
      //      indexer has no way to link an approval tx to a request).
      //   2. `user-signed-withdraw` — adds `initiateTxHash`, which is the
      //      key the merge would use to dedupe against the subgraph row.
      // REDEEM rows aren't surfaced in the table yet, but the local entries
      // still drive `useEarnTransactionsQuery` polling and the cooldown
      // sub-step's reactivity.
      const startedAt = Number(unixNowTimestamp())
      // `amountIn` for REDEEM stores the share amount being burned (raw
      // share-token units). The drawer displays this directly as "X
      // {shareSymbol}" — survives `resetStateAfterOperation()` clearing
      // the form input. DEPOSIT stores the asset amount instead; the
      // difference reflects what each kind actually puts in on-chain.
      const baseLocalPayload = {
        account: address,
        amountIn: shares.toString(),
        asset: selectedAsset.address,
        chainId,
        kind: 'REDEEM' as const,
        operator: address,
        shareAddress: pool.shareAddress,
        startedAt,
      }

      // Tracks the approval hash for this specific attempt. Seeded from
      // `priorApprovalTxHash` so retries (where allowance is still on-chain
      // and `user-signed-approval` won't fire) keep showing the original
      // approval step. Overwritten when a fresh approval is signed.
      let observedApprovalTxHash: Hash | undefined = priorApprovalTxHash

      const { emitter, promise } = requestRedeem({
        account: address,
        asset: selectedAsset.address,
        assetsOutMin,
        callbackFee,
        isInstant,
        operator: address,
        receiver: address,
        routerAddress,
        shares,
        shareToken: pool.shareAddress,
        walletClient,
      })

      emitter.on('user-signed-approval', function (approvalTxHash) {
        observedApprovalTxHash = approvalTxHash
        updateWithdrawOperation({
          amountIn: shares.toString(),
          approvalTxHash,
          status: WithdrawStatus.APPROVAL_TX_PENDING,
          transactionHash: undefined,
        })
        // Persist the approval hash to the local store so the drawer can
        // surface the approval step across route changes — the indexer
        // never sees this association.
        upsertLocalOperation({
          ...baseLocalPayload,
          approvalTxHash,
          operation: {
            status: WithdrawStatus.APPROVAL_TX_PENDING,
          },
        })
        setDrawerQueryString('withdrawing')
      })

      emitter.on('approve-transaction-reverted', function (receipt) {
        updateWithdrawOperation({
          status: WithdrawStatus.APPROVAL_TX_FAILED,
        })
        updateNativeBalanceAfterFees(receipt)
      })

      emitter.on('approve-transaction-succeeded', function (receipt) {
        updateWithdrawOperation({
          status: WithdrawStatus.APPROVAL_TX_COMPLETED,
        })
        updateNativeBalanceAfterFees(receipt)
        queryClient.invalidateQueries({ queryKey: allowanceQueryKey })
      })

      emitter.on('user-signing-approval-error', function () {
        updateWithdrawOperation({
          status: WithdrawStatus.APPROVAL_TX_FAILED,
        })
      })

      emitter.on('user-signed-withdraw', function (transactionHash) {
        updateWithdrawOperation({
          amountIn: shares.toString(),
          status: WithdrawStatus.WITHDRAW_TX_PENDING,
          transactionHash,
        })
        upsertLocalOperation({
          ...baseLocalPayload,
          approvalTxHash: observedApprovalTxHash,
          initiateTxHash: transactionHash,
          operation: {
            status: WithdrawStatus.WITHDRAW_TX_PENDING,
            transactionHash,
          },
        })
        // Hide the specific prior FAILED entry the user is replacing. Done
        // here (and not on retry click) so the row only disappears once the
        // user actually commits to the new attempt by signing.
        if (supersedesInitiateTxHash) {
          markSettledByInitiateTxHash(supersedesInitiateTxHash)
        }
        setDrawerQueryString('withdrawing')
      })

      emitter.on('user-signing-withdraw-error', function () {
        updateWithdrawOperation({
          status: WithdrawStatus.WITHDRAW_TX_FAILED,
        })
      })

      emitter.on('withdraw-transaction-succeeded', function (receipt) {
        // TODO(phase-3): parse the `RedeemRequested` log to capture the
        // requestId so the UI can track cross-chain fulfillment.
        updateWithdrawOperation({
          status: WithdrawStatus.WITHDRAW_TX_CONFIRMED,
        })
        upsertLocalOperation({
          ...baseLocalPayload,
          approvalTxHash: observedApprovalTxHash,
          initiateTxHash: receipt.transactionHash,
          operation: { status: WithdrawStatus.WITHDRAW_TX_CONFIRMED },
        })
        updateNativeBalanceAfterFees(receipt)
        // Optimistic bumps. Invalidation in `onSettled` reconciles, but the
        // chained cross-chain refetches take a beat, so the UI feels stale
        // without these.
        //   - `userPoolBalance`: per-asset assetOut/shares both go down.
        //   - `shareBalance`: wallet share OFT goes down by exactly `shares`.
        //   - `poolTotalAssets`: vault `totalAssets()` is in pegged-token
        //     units, so we subtract `peggedAmount` (pre-fetched via
        //     `convertToAssets`), not `amount`. If the pegged preview hasn't
        //     resolved, `peggedAmount` is `0n` and we skip — invalidation
        //     still corrects it.
        queryClient.setQueryData<{ assetOut: bigint; shares: bigint }>(
          userPoolBalanceQueryKey,
          old =>
            old
              ? {
                  assetOut:
                    old.assetOut > amount ? old.assetOut - amount : BigInt(0),
                  shares: old.shares > shares ? old.shares - shares : BigInt(0),
                }
              : old,
        )
        queryClient.setQueryData<bigint>(
          shareBalanceQueryKey,
          (old = BigInt(0)) => (old > shares ? old - shares : BigInt(0)),
        )
        if (peggedAmount > BigInt(0)) {
          queryClient.setQueryData<bigint>(
            poolTotalAssetsQueryKey,
            (old = BigInt(0)) =>
              old > peggedAmount ? old - peggedAmount : BigInt(0),
          )
        }
      })

      emitter.on('withdraw-transaction-reverted', function (receipt) {
        updateWithdrawOperation({
          status: WithdrawStatus.WITHDRAW_TX_FAILED,
        })
        upsertLocalOperation({
          ...baseLocalPayload,
          approvalTxHash: observedApprovalTxHash,
          initiateTxHash: receipt.transactionHash,
          operation: { status: WithdrawStatus.WITHDRAW_TX_FAILED },
        })
        updateNativeBalanceAfterFees(receipt)
      })

      emitter.on('withdraw-failed-validation', function () {
        updateWithdrawOperation({
          status: WithdrawStatus.WITHDRAW_TX_FAILED,
        })
      })

      emitter.on('quote-failed', function () {
        updateWithdrawOperation({
          status: WithdrawStatus.WITHDRAW_TX_FAILED,
        })
      })

      emitter.on('withdraw-failed', function () {
        updateWithdrawOperation({
          status: WithdrawStatus.WITHDRAW_TX_FAILED,
        })
      })

      emitter.on('unexpected-error', function () {
        updateWithdrawOperation({
          status: WithdrawStatus.WITHDRAW_TX_FAILED,
        })
      })

      on?.(emitter)

      return promise
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: tokenBalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: shareBalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: allowanceQueryKey })
      queryClient.invalidateQueries({ queryKey: nativeTokenBalanceQueryKey })
      queryClient.invalidateQueries({
        queryKey: poolTotalAssetsQueryKey,
      })
      queryClient.invalidateQueries({
        queryKey: userPoolBalanceQueryKeyPrefix,
      })
      // `removeQueries` (instead of `invalidateQueries`) is load-bearing for
      // this prefix. `fetchEarnPositions` reads inner share balances via
      // `ensureQueryData`, which returns stale cache when entries exist —
      // and `invalidateQueries` only refetches *active* subscribers, leaving
      // those inactive nested entries stale. Evicting forces the next read
      // path through the network and the staked-balance card actually
      // refreshes after a withdraw instead of waiting for a hard reload.
      queryClient.removeQueries({
        queryKey: earnPositionsKeyPrefix,
      })
    },
  })
}
