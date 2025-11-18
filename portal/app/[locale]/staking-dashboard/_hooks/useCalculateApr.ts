import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { unixNowTimestamp } from 'utils/time'
import { getBalanceOfNFTAt, getLockedBalance } from 've-hemi-actions/actions'

import {
  calculateApr,
  calculateRewardWeightDecay,
} from '../_utils/aprCalculations'

import { useRewardsPerVeHEMI } from './useRewardsPerVeHEMI'

const getCalculateAprQueryKey = ({
  chainId,
  tokenId,
}: {
  chainId: number
  tokenId: bigint
}) => ['calculateApr', tokenId.toString(), chainId]

/**
 * Calculates APR for a veHEMI position
 *
 * Process:
 * 1. Fetches rewards per veHEMI from API (60 epochs)
 * 2. Gets position data from contract (voting power, lock end, locked amount)
 * 3. Calculates voting power decay over 60 epochs
 * 4. Computes APR via dot product
 *
 * @param tokenId - The veHEMI NFT token ID
 * @param enabled - Whether to enable the query (default: true)
 * @returns APR as percentage (e.g., 4.84 for 4.84%)
 */
export const useCalculateApr = function ({
  enabled = true,
  tokenId,
}: {
  enabled?: boolean
  tokenId: bigint
}) {
  const { hemiWalletClient } = useHemiWalletClient()
  const { id } = useHemi()
  const { data: rewardsPerVeHEMI, error: isRewardsPerVeHEMIError } =
    useRewardsPerVeHEMI()

  const queryKey = getCalculateAprQueryKey({
    chainId: id,
    tokenId,
  })

  return useQuery({
    enabled:
      enabled &&
      !!hemiWalletClient &&
      !isRewardsPerVeHEMIError &&
      !!rewardsPerVeHEMI &&
      tokenId > BigInt(0),
    async queryFn() {
      // Step 1: Fetch position data from contract
      const currentTimestamp = unixNowTimestamp()

      const [currentBalance, lockedBalance] = await Promise.all([
        getBalanceOfNFTAt(hemiWalletClient!, tokenId, currentTimestamp),
        getLockedBalance(hemiWalletClient!, tokenId),
      ])

      // If no locked amount, APR is 0
      if (lockedBalance.amount === BigInt(0)) {
        return 0
      }

      // Step 2: Calculate reward weight over 60 epochs (360 days)
      const rewardWeightDecay = calculateRewardWeightDecay({
        currentBalance,
        currentTimestamp,
        lockEndTimestamp: lockedBalance.end,
      })

      // Step 3: Calculate APR using dot product
      return calculateApr({
        lockedAmount: lockedBalance.amount,
        rewardsPerVeHEMI,
        rewardWeightDecay,
      })
    },
    queryKey,
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  })
}
