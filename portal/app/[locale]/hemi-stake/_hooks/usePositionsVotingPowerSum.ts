import type { Address } from 'viem'

/** Prefix for invalidation: matches all position sum queries for this user/chain. Requires ownerAddress so invalidation reliably matches cached keys. */
export const getPositionsVotingPowerSumQueryKeyPrefix = ({
  chainId,
  ownerAddress,
}: {
  chainId: number
  ownerAddress: Address
}) => ['positions-voting-power-sum', chainId, ownerAddress.toLowerCase()]
