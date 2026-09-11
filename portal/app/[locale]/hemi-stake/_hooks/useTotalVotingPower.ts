import type { Address } from 'viem'

export const getTotalVotingPowerQueryKey = ({
  address,
  chainId,
}: {
  address?: Address
  chainId: number
}) => ['total-voting-power', chainId, address?.toLowerCase()]
