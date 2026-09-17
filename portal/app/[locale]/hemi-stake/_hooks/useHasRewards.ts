import { useClaimableRewards } from './useClaimableRewards'

export function useHasRewards(tokenId: bigint) {
  const { rewards } = useClaimableRewards(tokenId)

  return {
    hasRewards: rewards.some(({ amount }) => amount > BigInt(0)),
  }
}
