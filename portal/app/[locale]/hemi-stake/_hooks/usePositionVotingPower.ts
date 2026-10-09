import { usePositionDelegationDetails } from './usePositionDelegationDetails'

export const usePositionVotingPower = function (
  tokenId: bigint,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return usePositionDelegationDetails(tokenId, {
    enabled,
    select: delegationDetails => delegationDetails.votingPower,
  })
}
