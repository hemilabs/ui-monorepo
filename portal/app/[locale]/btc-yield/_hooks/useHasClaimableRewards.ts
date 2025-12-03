import { usePoolRewards } from './usePoolRewards'

export const useHasClaimableRewards = () =>
  usePoolRewards({
    select: poolRewards =>
      poolRewards.length > 0 &&
      poolRewards[1]?.some(amount => amount > BigInt(0)),
  })
