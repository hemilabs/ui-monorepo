import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEnsureConnectedTo } from 'hooks/useEnsureConnectedTo'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient, useHemiWalletClient } from 'hooks/useHemiClient'
import { useUpdateNativeBalanceAfterReceipt } from 'hooks/useInvalidateNativeBalanceAfterReceipt'
import { MerklRewards } from 'utils/merkl'
import { claimReward } from 'vault-rewards-actions/actions'
import { useAccount } from 'wagmi'

import {
  type BitcoinYieldClaimRewardOperation,
  BitcoinYieldClaimRewardStatus,
} from '../_types'

import { useMerklCampaigns } from './useMerklCampaigns'
import { getMerklRewardsQueryKey } from './useMerklRewards'
import { useVaultRewardsAddress } from './useVaultRewardsAddress'

type UseClaimRewards = {
  updateBitcoinYieldOperation: (
    payload: BitcoinYieldClaimRewardOperation,
  ) => void
}

export const useClaimRewards = function ({
  updateBitcoinYieldOperation,
}: UseClaimRewards) {
  const { address } = useAccount()
  const hemi = useHemi()
  const hemiClient = useHemiClient()
  const { hemiWalletClient } = useHemiWalletClient()
  const { data: merklCampaigns } = useMerklCampaigns()
  const { data: vaultRewardsAddress } = useVaultRewardsAddress()
  const queryClient = useQueryClient()
  const ensureConnectedTo = useEnsureConnectedTo()

  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    hemiClient.chain!.id,
  )

  const campaignIds = merklCampaigns?.map(c => c.campaignId)

  return useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error('No account connected')
      }

      if (!hemiClient.chain) {
        throw new Error('Chain is not defined')
      }

      if (!vaultRewardsAddress) {
        throw new Error('Vault rewards address not available')
      }

      await ensureConnectedTo(hemi.id)

      const { emitter, promise } = claimReward({
        account: address,
        vaultRewardsAddress,
        walletClient: hemiWalletClient!,
      })

      emitter.on('pre-claim-reward', function () {
        updateBitcoinYieldOperation({
          status: BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_PENDING,
        })
      })

      emitter.on('user-signed-claim-reward', function (transactionHash) {
        updateBitcoinYieldOperation({
          status: BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_PENDING,
          transactionHash,
        })
      })

      emitter.on('user-signing-claim-reward-error', function () {
        updateBitcoinYieldOperation({
          status: BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_FAILED,
        })
      })

      emitter.on('claim-reward-transaction-succeeded', function (receipt) {
        updateBitcoinYieldOperation({
          status: BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_CONFIRMED,
        })

        // Update native balance after fees
        updateNativeBalanceAfterFees(receipt)

        // Optimistically set rewards to empty array since they were claimed
        queryClient.setQueryData(
          getMerklRewardsQueryKey({
            address,
            campaignIds,
          }),
          (oldRewards: MerklRewards) =>
            oldRewards.map(oldReward => ({
              ...oldReward,
              // when claiming, the "claimed" rewards equals the "amount"
              claimed: oldReward.amount,
            })),
        )
      })

      emitter.on('claim-reward-transaction-reverted', function (receipt) {
        updateBitcoinYieldOperation({
          status: BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_FAILED,
        })

        // Although the transaction was reverted, gas was still paid
        updateNativeBalanceAfterFees(receipt)
      })

      emitter.on('claim-reward-failed-validation', function () {
        updateBitcoinYieldOperation({
          status: BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_FAILED,
        })
      })

      return promise
    },
    onSettled() {
      // Always invalidate pool rewards on settlement
      queryClient.invalidateQueries({
        queryKey: getMerklRewardsQueryKey({
          address,
          campaignIds,
        }),
      })
    },
  })
}
