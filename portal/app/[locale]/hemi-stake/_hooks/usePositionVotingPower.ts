import { usePositionDelegationDetails } from './usePositionDelegationDetails'

export const usePositionVotingPower = (tokenId: bigint) =>
  usePositionDelegationDetails(tokenId, {
    select: delegationDetails => delegationDetails.votingPower,
  })
