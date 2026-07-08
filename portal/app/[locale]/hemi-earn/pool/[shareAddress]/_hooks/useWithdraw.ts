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
import { maxBigInt } from 'utils/bigint'
import { unixNowTimestamp } from 'utils/time'
import { type Hash } from 'viem'
import { useAccount, useConfig } from 'wagmi'
import { getWalletClient } from 'wagmi/actions'

import { earnPositionsKeyPrefix } from '../../../_fetchers/fetchEarnPositions'
import { earnTvlQueryKey } from '../../../_hooks/useEarnTvl'
import { useLocalEarnOperations } from '../../../_hooks/useLocalEarnOperations'
import { type EarnAsset, type EarnPool } from '../../../types'
import { getUserShareValueQueryKey } from '../_fetchers/fetchUserShareValue'
import { type WithdrawOperation, WithdrawStatus } from '../_types/operations'

import { useDrawerQueryString } from './useDrawerQueryString'

type UseWithdraw = {
  // Slippage min in asset units; enforced remotely and frozen across the ~7d cooldown.
  assetsOutMin: bigint
  callbackFee: bigint
  // Must match what the Agent computes (via useQuoteRedeem) — a mismatch makes the Agent bounce the request as cancel.
  isInstant: boolean
  on?: (emitter: EventEmitter<RequestRedeemEvents>) => void
  // Pegged amount leaving totalAssets() on redeem (from useSharesToAssets); 0n while the preview is pending, reconciled by onSettled.
  peggedAmount: bigint
  pool: EarnPool
  // Retry callers pass the prior approval hash (allowance still on-chain, so no new
  // user-signed-approval); carried into the new entry so the drawer keeps the approval step.
  priorApprovalTxHash?: Hash
  selectedAsset: EarnAsset
  // Withdraw amount in shareToken units; the Router's requestRedeem burns this many shares on Hemi.
  shares: bigint
  // Retry callers pass the FAILED attempt's initiateTxHash; once the new withdraw is signed,
  // that entry is flagged settled so the old failure doesn't show beside the new attempt.
  supersedesInitiateTxHash?: Hash
  updateWithdrawOperation?: (payload?: WithdrawOperation) => void
}

export const useWithdraw = function ({
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

  const userShareValueQueryKey = getUserShareValueQueryKey({
    account: address,
    shareAddress: pool.shareAddress,
  })

  const poolTotalAssetsQueryKey = earnTvlQueryKey({
    networkType,
    stakingVault: pool.stakingVault,
  })

  return useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error('No account connected')
      }

      await ensureConnectedTo(chainId)

      const walletClient = await getWalletClient(config, { chainId })

      // Local entries are created at two points: user-signed-approval (captures approvalTxHash,
      // unlinkable by the indexer) and user-signed-withdraw (adds initiateTxHash, the merge dedupe key).
      const startedAt = Number(unixNowTimestamp())
      // REDEEM stores the share amount being burned (share-token units), not the asset —
      // that's what the drawer shows and what goes on-chain.
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

      // Approval hash for this attempt; seeded from priorApprovalTxHash for retries, overwritten if a fresh approval is signed.
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
        updateWithdrawOperation?.({
          amountIn: shares.toString(),
          approvalTxHash,
          status: WithdrawStatus.APPROVAL_TX_PENDING,
          transactionHash: undefined,
        })
        // Persist so the drawer can show the approval step across routes (the indexer never links it).
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
        updateWithdrawOperation?.({
          status: WithdrawStatus.APPROVAL_TX_FAILED,
        })
        updateNativeBalanceAfterFees(receipt)
      })

      emitter.on('approve-transaction-succeeded', function (receipt) {
        updateWithdrawOperation?.({
          status: WithdrawStatus.APPROVAL_TX_COMPLETED,
        })
        updateNativeBalanceAfterFees(receipt)
        queryClient.invalidateQueries({ queryKey: allowanceQueryKey })
      })

      emitter.on('user-signing-approval-error', function () {
        updateWithdrawOperation?.({
          status: WithdrawStatus.APPROVAL_TX_FAILED,
        })
      })

      emitter.on('user-signed-withdraw', function (transactionHash) {
        updateWithdrawOperation?.({
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
        // Hide the prior FAILED entry — here, not on retry click, so it only disappears once the user actually signs.
        if (supersedesInitiateTxHash) {
          markSettledByInitiateTxHash(supersedesInitiateTxHash)
        }
        setDrawerQueryString('withdrawing')
      })

      emitter.on('user-signing-withdraw-error', function () {
        updateWithdrawOperation?.({
          status: WithdrawStatus.WITHDRAW_TX_FAILED,
        })
      })

      emitter.on('withdraw-transaction-succeeded', function (receipt) {
        // TODO(phase-3): parse the `RedeemRequested` log to capture the
        // requestId so the UI can track cross-chain fulfillment.
        updateWithdrawOperation?.({
          status: WithdrawStatus.WITHDRAW_TX_CONFIRMED,
        })
        upsertLocalOperation({
          ...baseLocalPayload,
          approvalTxHash: observedApprovalTxHash,
          initiateTxHash: receipt.transactionHash,
          operation: { status: WithdrawStatus.WITHDRAW_TX_CONFIRMED },
        })
        updateNativeBalanceAfterFees(receipt)
        // Optimistic bumps for user-side caches only — the Hemi tx burns the user's shares now.
        // Pool TVL waits for onSettled + the delivery watcher: the Ethereum vault still holds the
        // assets until the relay lands, so debiting here would under-report TVL.
        queryClient.setQueryData<{ peggedAmount: bigint; shares: bigint }>(
          userShareValueQueryKey,
          old =>
            old
              ? {
                  peggedAmount:
                    peggedAmount > BigInt(0)
                      ? maxBigInt(old.peggedAmount - peggedAmount, BigInt(0))
                      : old.peggedAmount,
                  shares: maxBigInt(old.shares - shares, BigInt(0)),
                }
              : old,
        )
        queryClient.setQueryData<bigint>(shareBalanceQueryKey, old =>
          old === undefined ? old : maxBigInt(old - shares, BigInt(0)),
        )
      })

      emitter.on('withdraw-transaction-reverted', function (receipt) {
        updateWithdrawOperation?.({
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
        updateWithdrawOperation?.({
          status: WithdrawStatus.WITHDRAW_TX_FAILED,
        })
      })

      emitter.on('quote-failed', function () {
        updateWithdrawOperation?.({
          status: WithdrawStatus.WITHDRAW_TX_FAILED,
        })
      })

      emitter.on('withdraw-failed', function () {
        updateWithdrawOperation?.({
          status: WithdrawStatus.WITHDRAW_TX_FAILED,
        })
      })

      emitter.on('unexpected-error', function () {
        updateWithdrawOperation?.({
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
      queryClient.invalidateQueries({ queryKey: userShareValueQueryKey })
      // resetQueries (not removeQueries) so the useEarnPositions observer refetches — removeQueries
      // evicts but leaves observers unnotified, and reset also lets fetchEarnPositions' inner
      // ensureQueryData reads hit the network instead of returning stale balances.
      queryClient.resetQueries({ queryKey: earnPositionsKeyPrefix })
    },
  })
}
