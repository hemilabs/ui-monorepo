import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEnsureConnectedTo } from 'hooks/useEnsureConnectedTo'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient, useHemiWalletClient } from 'hooks/useHemiClient'
import { useUpdateNativeBalanceAfterReceipt } from 'hooks/useInvalidateNativeBalanceAfterReceipt'
import { claimAllRewards } from 'merkl-claim-rewards/actions'
import { MerklRewards } from 'utils/merkl'
import { hemi as hemiMainnet } from 'viem/chains'
import { useAccount } from 'wagmi'

import {
  type BitcoinYieldClaimRewardOperation,
  BitcoinYieldClaimRewardStatus,
} from '../_types'
import {
  MERKL_DISTRIBUTOR_ADDRESS,
  transformMerklRewardsToClaimParams,
} from '../_utils'

import { useMerklCampaigns } from './useMerklCampaigns'
import { getMerklRewardsQueryKey, useMerklRewards } from './useMerklRewards'

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
  const { data: merklData } = useMerklCampaigns()
  const { data: merklRewards } = useMerklRewards()
  const queryClient = useQueryClient()
  const ensureConnectedTo = useEnsureConnectedTo()

  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    hemiClient.chain!.id,
  )

  const campaignIds = merklData?.campaigns.map(c => c.campaignId)

  return useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error('No account connected')
      }

      // Throw error if on hemi sepolia (testnet)
      if (hemi.id !== hemiMainnet.id) {
        throw new Error('Claiming rewards is only available on Hemi mainnet')
      }

      if (!merklRewards || merklRewards.length === 0) {
        throw new Error('No merkl rewards available')
      }

      await ensureConnectedTo(hemi.id)

      const claimParams = transformMerklRewardsToClaimParams(merklRewards)

      if (claimParams.amounts.length === 0) {
        throw new Error('No claimable rewards available')
      }

      const { emitter, promise } = claimAllRewards({
        account: address,
        client: hemiWalletClient!,
        distributorAddress: MERKL_DISTRIBUTOR_ADDRESS,
        ...claimParams,
      })

      emitter.on('pre-claim-all-rewards', function () {
        updateBitcoinYieldOperation({
          status: BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_PENDING,
        })
      })

      emitter.on('user-signed-claim-all-rewards', function (transactionHash) {
        updateBitcoinYieldOperation({
          status: BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_PENDING,
          transactionHash,
        })
      })

      emitter.on('user-signing-claim-all-rewards-error', function () {
        updateBitcoinYieldOperation({
          status: BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_FAILED,
        })
      })

      emitter.on('claim-all-rewards-transaction-succeeded', function (receipt) {
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

      emitter.on('claim-all-rewards-transaction-reverted', function (receipt) {
        updateBitcoinYieldOperation({
          status: BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_FAILED,
        })

        // Although the transaction was reverted, gas was still paid
        updateNativeBalanceAfterFees(receipt)
      })

      emitter.on('claim-all-rewards-failed-validation', function () {
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
