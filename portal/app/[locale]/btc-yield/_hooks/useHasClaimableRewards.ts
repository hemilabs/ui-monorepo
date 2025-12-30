import { useMerklRewards } from './useMerklRewards'

export const useHasClaimableRewards = () =>
  useMerklRewards({
    select: rewards =>
      rewards.length > 0 &&
      rewards.some(reward => BigInt(reward.amount) > BigInt(reward.claimed)),
  })
