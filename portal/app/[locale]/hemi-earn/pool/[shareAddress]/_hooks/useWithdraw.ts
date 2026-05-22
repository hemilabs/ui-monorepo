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
import { useTokenBalance } from 'hooks/useBalance'
import { useNetworkType } from 'hooks/useNetworkType'
import { buildAllowanceQueryKey } from 'utils/allowanceQueryKey'
import { useAccount, useConfig } from 'wagmi'
import { getWalletClient } from 'wagmi/actions'

import { earnPositionsKeyPrefix } from '../../../_fetchers/fetchEarnPositions'
import { earnTvlQueryKey } from '../../../_hooks/useEarnTvl'
import { type EarnAsset, type EarnPool } from '../../../types'
import { type WithdrawOperation, WithdrawStatus } from '../_types/operations'

import { useDrawerQueryString } from './useDrawerQueryString'
import { getUserPoolBalanceQueryKey } from './useUserPoolBalance'

type UseWithdraw = {
  // User-entered withdraw amount in `selectedAsset` units. Drives the
  // optimistic TVL/balance updates after the redeem mines.
  amount: bigint
  fulfillmentFee: bigint
  on?: (emitter: EventEmitter<RequestRedeemEvents>) => void
  // Pegged-token amount that will leave `totalAssets()` when these shares
  // are redeemed. Computed by the caller (the withdraw drawer) alongside
  // the asset→shares conversion in `useAssetsToShares`. Pass `0n` while
  // the preview is pending; `onSettled` invalidation reconciles.
  peggedAmount: bigint
  pool: EarnPool
  selectedAsset: EarnAsset
  // Pre-converted share amount in shareToken units. Computed by the caller
  // (the withdraw drawer) via `convertToShares` so the off-chain input flow
  // stays close to the asset-unit UX while this hook stays focused on the
  // on-chain submission.
  shares: bigint
  updateWithdrawOperation: (payload?: WithdrawOperation) => void
}

export const useWithdraw = function ({
  amount,
  fulfillmentFee,
  on,
  peggedAmount,
  pool,
  selectedAsset,
  shares,
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

  const { queryKey: tokenBalanceQueryKey } = useTokenBalance(
    chainId,
    selectedAsset.address,
  )

  const { queryKey: shareBalanceQueryKey } = useTokenBalance(
    chainId,
    pool.shareAddress,
  )

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

      const { emitter, promise } = requestRedeem({
        account: address,
        asset: selectedAsset.address,
        fulfillmentFee,
        receiver: address,
        routerAddress,
        shares,
        shareToken: pool.shareAddress,
        walletClient,
      })

      emitter.on('user-signed-approval', function (approvalTxHash) {
        updateWithdrawOperation({
          approvalTxHash,
          status: WithdrawStatus.APPROVAL_TX_PENDING,
          transactionHash: undefined,
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
          status: WithdrawStatus.WITHDRAW_TX_PENDING,
          transactionHash,
        })
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
      queryClient.invalidateQueries({
        queryKey: earnPositionsKeyPrefix,
      })
    },
  })
}
