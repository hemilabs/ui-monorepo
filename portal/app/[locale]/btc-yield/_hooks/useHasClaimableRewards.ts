import { useMerklRewards } from './useMerklRewards'

export const useHasClaimableRewards = () =>
  useMerklRewards({
    select: rewards =>
      rewards.length > 0 && rewards.some(r => r.breakdowns.length > 0),
  })
