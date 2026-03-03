import pMemoize from 'promise-mem'
import { isAddress, isAddressEqual, type Address, type Client } from 'viem'
import { multicall, readContract } from 'viem/actions'

import { veHemiAbi } from '../../abi'
import { veHemiVoteDelegationAbi } from '../../voteDelegationAbi'

import { getVeHemiContractAddress } from './../../constants'

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

export const getPositionVotingPower = async function ({
  client,
  ownerAddress,
  tokenId,
}: {
  client: Client
  ownerAddress: Address
  tokenId: bigint
}) {
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

  const now = BigInt(Math.floor(Date.now() / 1000))
  return delegationToVotingPower(delegation, ownerAddress, now)
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

  const voteDelegationAddress = await memoizedGetVoteDelegationAddress(client)
  const now = BigInt(Math.floor(Date.now() / 1000))

  const contracts = tokenIds.map(
    tokenId =>
      ({
        abi: veHemiVoteDelegationAbi,
        address: voteDelegationAddress,
        args: [tokenId],
        functionName: 'delegation',
      }) as const,
  )
  const results = await multicall(client, {
    allowFailure: false,
    contracts,
  })

  let sum = BigInt(0)
  for (let i = 0; i < results.length; i++) {
    sum += delegationToVotingPower(results[i], ownerAddress, now)
  }
  return sum
}

export const getTotalVotingPower = async function ({
  account,
  client,
}: {
  account: Address
  client: Client
}) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  if (!isAddress(account)) {
    throw new Error('Invalid account address')
  }

  const voteDelegationAddress = await memoizedGetVoteDelegationAddress(client)

  const votes = await readContract(client, {
    abi: veHemiVoteDelegationAbi,
    address: voteDelegationAddress,
    args: [account],
    functionName: 'getVotes',
  })

  return votes
}
