import pMemoize from 'promise-mem'
import { isAddress, isAddressEqual, type Address, type Client } from 'viem'
import { multicall, readContract } from 'viem/actions'

import { veHemiAbi } from '../../abi.ts'
import { unixNowTimestamp } from '../../utils.ts'
import { veHemiVoteDelegationAbi } from '../../voteDelegationAbi.ts'

import { getVeHemiContractAddress } from './../../constants.ts'

export const getHemiTokenAddress = async function (client: Client) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  const veHemiAddress = getVeHemiContractAddress(client.chain.id)

  return readContract(client, {
    abi: veHemiAbi,
    address: veHemiAddress,
    functionName: 'HEMI',
  })
}

export const memoizedGetHemiTokenAddress = pMemoize(getHemiTokenAddress, {
  resolver: w => w.chain?.id,
})

export const getLockedBalance = async function (
  client: Client,
  tokenId: bigint,
) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  const veHemiAddress = getVeHemiContractAddress(client.chain.id)

  return readContract(client, {
    abi: veHemiAbi,
    address: veHemiAddress,
    args: [tokenId],
    functionName: 'getLockedBalance',
  })
}

export const getOwnerOf = async function (client: Client, tokenId: bigint) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  const veHemiAddress = getVeHemiContractAddress(client.chain.id)

  return readContract(client, {
    abi: veHemiAbi,
    address: veHemiAddress,
    args: [tokenId],
    functionName: 'ownerOf',
  })
}

export const getLivePositionClass = async function (
  client: Client,
  tokenId: bigint,
) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  const veHemiAddress = getVeHemiContractAddress(client.chain.id)

  const [forfeitable, transferableAfter] = await multicall(client, {
    allowFailure: false,
    contracts: [
      {
        abi: veHemiAbi,
        address: veHemiAddress,
        args: [tokenId],
        functionName: 'forfeitable',
      },
      {
        abi: veHemiAbi,
        address: veHemiAddress,
        args: [tokenId],
        functionName: 'transferableAfter',
      },
    ],
  })

  return { forfeitable, transferableAfter }
}

export const getBalanceOfNFTAt = async function (
  client: Client,
  tokenId: bigint,
  timestamp: bigint,
) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  const veHemiAddress = getVeHemiContractAddress(client.chain.id)

  return readContract(client, {
    abi: veHemiAbi,
    address: veHemiAddress,
    args: [tokenId, timestamp],
    functionName: 'balanceOfNFTAt',
  })
}

const getVoteDelegationAddress = async function (client: Client) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  const veHemiAddress = getVeHemiContractAddress(client.chain.id)

  return readContract(client, {
    abi: veHemiAbi,
    address: veHemiAddress,
    functionName: 'voteDelegation',
  })
}

const memoizedGetVoteDelegationAddress = pMemoize(getVoteDelegationAddress, {
  resolver: client => client.chain?.id,
})

function delegationToVotingPower(
  delegation: {
    bias: bigint
    delegatee: Address
    end: bigint | number
    slope: bigint
  },
  ownerAddress: Address,
  now: bigint,
): bigint {
  if (!isAddressEqual(delegation.delegatee, ownerAddress)) return BigInt(0)
  const end = BigInt(delegation.end)
  if (end <= now) return BigInt(0)
  const voteDecay = delegation.slope * now
  return delegation.bias > voteDecay ? delegation.bias - voteDecay : BigInt(0)
}

const isDelegationActive = (
  delegation: {
    end: bigint | number
  },
  now: bigint,
) => BigInt(delegation.end) > now

const isDelegatedAway = (
  delegation: {
    delegatee: Address
    end: bigint | number
  },
  ownerAddress: Address,
  now: bigint,
) =>
  isDelegationActive(delegation, now) &&
  !isAddressEqual(delegation.delegatee, ownerAddress)

const fetchDelegations = async function ({
  client,
  tokenIds,
}: {
  client: Client
  tokenIds: bigint[]
}) {
  const voteDelegationAddress = await memoizedGetVoteDelegationAddress(client)
  return multicall(client, {
    allowFailure: false,
    contracts: tokenIds.map(
      tokenId =>
        ({
          abi: veHemiVoteDelegationAbi,
          address: voteDelegationAddress,
          args: [tokenId],
          functionName: 'delegation',
        }) as const,
    ),
  })
}

type PositionVotingPowerDetails = {
  delegatee: Address
  isDelegatedAway: boolean
  votingPower: bigint
}

export const getPositionVotingPowerDetails = async function ({
  client,
  ownerAddress,
  tokenId,
}: {
  client: Client
  ownerAddress: Address
  tokenId: bigint
}): Promise<PositionVotingPowerDetails> {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  if (!isAddress(ownerAddress)) {
    throw new Error('Invalid owner address')
  }

  const voteDelegationAddress = await memoizedGetVoteDelegationAddress(client)

  const delegation = await readContract(client, {
    abi: veHemiVoteDelegationAbi,
    address: voteDelegationAddress,
    args: [tokenId],
    functionName: 'delegation',
  })

  const now = unixNowTimestamp()

  return {
    delegatee: delegation.delegatee,
    isDelegatedAway: isDelegatedAway(delegation, ownerAddress, now),
    votingPower: delegationToVotingPower(delegation, ownerAddress, now),
  }
}

export const getPositionsDelegatedAway = async function ({
  client,
  ownerAddress,
  tokenIds,
}: {
  client: Client
  ownerAddress: Address
  tokenIds: bigint[]
}) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }
  if (!isAddress(ownerAddress)) {
    throw new Error('Invalid owner address')
  }
  if (tokenIds.length === 0) {
    return {} as Record<string, boolean>
  }

  const now = unixNowTimestamp()
  const delegations = await fetchDelegations({ client, tokenIds })

  return Object.fromEntries(
    tokenIds.map((tokenId, index) => [
      tokenId.toString(),
      isDelegatedAway(delegations[index], ownerAddress, now),
    ]),
  )
}

export const getPositionsVotingPowerSum = async function ({
  client,
  ownerAddress,
  tokenIds,
}: {
  client: Client
  ownerAddress: Address
  tokenIds: bigint[]
}) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }
  if (!isAddress(ownerAddress)) {
    throw new Error('Invalid owner address')
  }
  if (tokenIds.length === 0) {
    return BigInt(0)
  }

  const now = unixNowTimestamp()
  const delegations = await fetchDelegations({ client, tokenIds })

  return delegations.reduce(
    (sum, delegation) =>
      sum + delegationToVotingPower(delegation, ownerAddress, now),
    BigInt(0),
  )
}

export const getTotalVotingPower = async function ({
  client,
  ownerAddress,
}: {
  client: Client
  ownerAddress: Address
}) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  if (!isAddress(ownerAddress)) {
    throw new Error('Invalid owner address')
  }

  const voteDelegationAddress = await memoizedGetVoteDelegationAddress(client)

  const votes = await readContract(client, {
    abi: veHemiVoteDelegationAbi,
    address: voteDelegationAddress,
    args: [ownerAddress],
    functionName: 'getVotes',
  })

  return votes
}

export const getTransferableAfter = async function (
  client: Client,
  tokenIds: bigint[],
) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  if (tokenIds.length === 0) {
    return []
  }

  const veHemiAddress = getVeHemiContractAddress(client.chain.id)

  return multicall(client, {
    allowFailure: false,
    contracts: tokenIds.map(tokenId => ({
      abi: veHemiAbi,
      address: veHemiAddress,
      args: [tokenId],
      functionName: 'transferableAfter' as const,
    })),
  })
}
