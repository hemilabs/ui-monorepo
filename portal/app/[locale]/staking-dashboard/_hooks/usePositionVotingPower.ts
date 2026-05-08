import type { Address, Chain } from 'viem'

import {
  getPositionDelegationDetailsQueryKey,
  usePositionDelegationDetails,
} from './usePositionDelegationDetails'

export const getPositionVotingPowerQueryKey = ({
  chainId,
  ownerAddress,
  tokenId,
}: {
  chainId: Chain['id']
  ownerAddress: Address | undefined
  tokenId: bigint
}) =>
  getPositionDelegationDetailsQueryKey({
    chainId,
    ownerAddress,
    tokenId,
  })

export const usePositionVotingPower = (tokenId: bigint) =>
  usePositionDelegationDetails(tokenId, {
    select: delegationDetails => delegationDetails.votingPower,
  })
