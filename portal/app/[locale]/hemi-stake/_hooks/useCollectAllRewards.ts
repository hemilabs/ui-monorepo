import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { useUpdateNativeBalanceAfterReceipt } from '@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import { getTokenBalanceQueryKey } from 'hooks/useBalance'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useUmami } from 'hooks/useUmami'
import {
  CollectAllRewardsDashboardStatus,
  type CollectAllRewardsDashboardOperation,
  type CollectAllRewardsStep,
} from 'types/stakingDashboard'
import type { ClaimFromEvents } from 've-hemi-epoch-rewards'
import { claimFrom } from 've-hemi-epoch-rewards/actions'
import { useAccount } from 'wagmi'

import { useClaimableRewards } from './useClaimableRewards'
import { useDrawerStakingQueryString } from './useDrawerStakingQueryString'
import { getEpochClaimableRewardsQueryKeyPrefix } from './useEpochClaimableRewards'

type UseCollectRewards = {
  on?: (emitter: EventEmitter<ClaimFromEvents>) => void
  tokenId: bigint
  updateCollectRewardsDashboardOperation: (
    payload?: CollectAllRewardsDashboardOperation,
  ) => void
}

/**
 * Claims everything one position is owed, in as many transactions as it takes.
 *
 * A claim is bounded by epoch x reward token pairs, so a position with a long history
 * cannot be settled in one call. The plan is known before the first signature - it comes
 * from the same windows the claimable figures were quoted over - and every window is
 * reported as its own step so the drawer can follow the whole walk.
 *
 * The walk stops at the first window the holder does not sign or that reverts. What the
 * earlier windows paid is already theirs, and a retry re-plans over what is left.
 */
export const useCollectRewards = function ({
  on,
  tokenId,
  updateCollectRewardsDashboardOperation,
}: UseCollectRewards) {
  const { setDrawerQueryString } = useDrawerStakingQueryString()
  const { track } = useUmami()
  const { address } = useAccount()
  const ensureConnectedTo = useEnsureConnectedTo()
  const queryClient = useQueryClient()
  const hemi = useHemi()
  const { rewards, transactions } = useClaimableRewards(tokenId)

  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    hemi.id,
  )

  const { queryKey: nativeTokenBalanceQueryKey } = useNativeBalance(hemi.id)

  const { hemiWalletClient } = useHemiWalletClient()

  return useMutation({
    mutationFn: async function runCollectRewards() {
      if (!address) {
        throw new Error('No account connected')
      }

      await ensureConnectedTo(hemi.id)

      let steps: CollectAllRewardsStep[] = transactions.map(transaction => ({
        ...transaction,
      }))

      const updateStep = function (
        index: number,
        step: Partial<CollectAllRewardsStep>,
      ) {
        steps = steps.map((current, position) =>
          position === index ? { ...current, ...step } : current,
        )
        updateCollectRewardsDashboardOperation({ steps })
      }

      updateCollectRewardsDashboardOperation({ status: undefined, steps })
      setDrawerQueryString('claimingRewards')

      // Sequential on purpose: every window is a signature, and a wallet asked for
      // several at once queues them in an order the drawer cannot follow.
      for (const [index, transaction] of transactions.entries()) {
        let failed = false

        const { emitter, promise } = claimFrom({
          account: address,
          fromEpoch: transaction.fromEpoch,
          toEpoch: transaction.toEpoch,
          tokenId,
          // The window is narrow enough for one call to settle every reward token, and
          // `claimFrom` refuses to sign when the simulation disagrees.
          tokenStart: BigInt(0),
          walletClient: hemiWalletClient!,
        })

        emitter.on('user-signed-claim-from', function (transactionHash) {
          track?.('hemi stake - signed collect rewards')
          updateStep(index, {
            status: CollectAllRewardsDashboardStatus.COLLECT_TX_PENDING,
            transactionHash,
          })
          updateCollectRewardsDashboardOperation({
            status: CollectAllRewardsDashboardStatus.COLLECT_TX_PENDING,
            transactionHash,
          })
        })

        emitter.on('user-signing-claim-from-error', function () {
          track?.('hemi stake - signing collect rewards error')
          failed = true
          updateStep(index, {
            status: CollectAllRewardsDashboardStatus.COLLECT_TX_FAILED,
          })
        })

        emitter.on('claim-from-failed', function () {
          failed = true
          updateStep(index, {
            status: CollectAllRewardsDashboardStatus.COLLECT_TX_FAILED,
          })
        })

        emitter.on('claim-from-failed-validation', function () {
          failed = true
          updateStep(index, {
            status: CollectAllRewardsDashboardStatus.COLLECT_TX_FAILED,
          })
        })

        emitter.on('claim-from-transaction-succeeded', function (receipt) {
          track?.('hemi stake - collect rewards transaction succeeded')
          updateNativeBalanceAfterFees(receipt)
          updateStep(index, {
            status: CollectAllRewardsDashboardStatus.COLLECT_TX_CONFIRMED,
            transactionHash: receipt.transactionHash,
          })
          updateCollectRewardsDashboardOperation({
            transactionHash: receipt.transactionHash,
          })
        })

        emitter.on('claim-from-transaction-reverted', function (receipt) {
          track?.('hemi stake - collect rewards transaction reverted')
          // Although the transaction was reverted, the gas was paid
          updateNativeBalanceAfterFees(receipt)
          failed = true
          updateStep(index, {
            status: CollectAllRewardsDashboardStatus.COLLECT_TX_FAILED,
            transactionHash: receipt.transactionHash,
          })
        })

        emitter.on('unexpected-error', function () {
          track?.('hemi stake - unexpected error')
          failed = true
          updateStep(index, {
            status: CollectAllRewardsDashboardStatus.COLLECT_TX_FAILED,
          })
        })

        on?.(emitter)

        await promise

        if (failed) {
          updateCollectRewardsDashboardOperation({
            status: CollectAllRewardsDashboardStatus.COLLECT_TX_FAILED,
          })
          return
        }
      }

      updateCollectRewardsDashboardOperation({
        status: CollectAllRewardsDashboardStatus.COLLECT_TX_CONFIRMED,
      })
    },
    onSettled() {
      // Invalidate in the background. Returning these would hold the mutation open and
      // leave the UI out of sync until every balance is re-read.
      queryClient.invalidateQueries({
        queryKey: getEpochClaimableRewardsQueryKeyPrefix({
          chainId: hemi.id,
          tokenId,
        }),
      })

      // The wallet ERC-20 balance of every collected reward token, so the balances shown
      // in the UI reflect the just-claimed amounts.
      if (address) {
        rewards.forEach(({ token }) =>
          queryClient.invalidateQueries({
            queryKey: getTokenBalanceQueryKey({
              account: address,
              chainId: hemi.id,
              tokenAddress: token,
            }),
          }),
        )
      }

      queryClient.invalidateQueries({ queryKey: nativeTokenBalanceQueryKey })
    },
  })
}
