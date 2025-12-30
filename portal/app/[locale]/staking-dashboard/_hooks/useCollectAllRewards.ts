import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import { useNativeTokenBalance } from 'hooks/useBalance'
import { useEnsureConnectedTo } from 'hooks/useEnsureConnectedTo'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useUpdateNativeBalanceAfterReceipt } from 'hooks/useInvalidateNativeBalanceAfterReceipt'
import { useUmami } from 'hooks/useUmami'
import {
  CollectAllRewardsDashboardOperation,
  CollectAllRewardsDashboardStatus,
} from 'types/stakingDashboard'
import type { CollectAllRewardsEvents } from 've-hemi-rewards'
import { collectAllRewards } from 've-hemi-rewards/actions'
import { useAccount } from 'wagmi'

import { getCalculateRewardsQueryKey } from './useCalculateRewards'
import { useDrawerStakingQueryString } from './useDrawerStakingQueryString'
import { useRewardTokens } from './useRewardTokens'

type UseCollectRewards = {
  on?: (emitter: EventEmitter<CollectAllRewardsEvents>) => void
  tokenId: bigint
  updateCollectRewardsDashboardOperation: (
    payload?: CollectAllRewardsDashboardOperation,
  ) => void
}

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
  const { tokens: rewardTokens } = useRewardTokens()
  const hemi = useHemi()

  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    hemi.id,
  )

  const { queryKey: nativeTokenBalanceQueryKey } = useNativeTokenBalance(
    hemi.id,
  )

  const { hemiWalletClient } = useHemiWalletClient()

  return useMutation({
    mutationFn: async function runCollectRewards() {
      if (!address) {
        throw new Error('No account connected')
      }

      await ensureConnectedTo(hemi.id)

      const { emitter, promise } = collectAllRewards({
        account: address,
        addToPositionBPS: BigInt(0),
        tokenId,
        walletClient: hemiWalletClient!,
      })

      emitter.on('user-signed-collect-all-rewards', function (transactionHash) {
        track?.('staking dashboard - signed collect rewards')
        updateCollectRewardsDashboardOperation({
          status: CollectAllRewardsDashboardStatus.COLLECT_TX_PENDING,
          transactionHash,
        })
        setDrawerQueryString('claimingRewards')
      })

      emitter.on('user-signing-collect-all-rewards-error', function () {
        track?.('staking dashboard - signing collect rewards error')

        updateCollectRewardsDashboardOperation({
          status: CollectAllRewardsDashboardStatus.COLLECT_TX_FAILED,
        })
      })

      emitter.on(
        'collect-all-rewards-transaction-succeeded',
        function (receipt) {
          track?.('staking dashboard - collect rewards transaction succeeded')

          // Update native balance for gas fees
          updateNativeBalanceAfterFees(receipt)

          // Update rewards to zero
          rewardTokens.forEach(function ({ address: rewardsAddress }) {
            const queryKey = getCalculateRewardsQueryKey({
              chainId: hemi.id,
              rewardToken: rewardsAddress,
              tokenId,
            })
            queryClient.setQueryData(queryKey, () => BigInt(0))
          })

          updateCollectRewardsDashboardOperation({
            status: CollectAllRewardsDashboardStatus.COLLECT_TX_CONFIRMED,
          })
        },
      )

      emitter.on(
        'collect-all-rewards-transaction-reverted',
        function (receipt) {
          track?.('staking dashboard - collect rewards transaction reverted')

          // Although the transaction was reverted, the gas was paid
          updateNativeBalanceAfterFees(receipt)

          updateCollectRewardsDashboardOperation({
            status: CollectAllRewardsDashboardStatus.COLLECT_TX_FAILED,
          })
        },
      )

      on?.(emitter)

      return promise
    },
    onSettled() {
      // Invalidate rewards queries in the background
      rewardTokens.forEach(function ({ address: rewardsAddress }) {
        const queryKey = getCalculateRewardsQueryKey({
          chainId: hemi.id,
          rewardToken: rewardsAddress,
          tokenId,
        })
        queryClient.invalidateQueries({ queryKey })
      })

      // Invalidate native token balance in the background
      queryClient.invalidateQueries({ queryKey: nativeTokenBalanceQueryKey })
    },
  })
}
