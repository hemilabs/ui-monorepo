import pMemoize from 'promise-mem'
import { isAddress, isAddressEqual, type Address, type Client } from 'viem'
import { readContract } from 'viem/actions'

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

  // If delegated to another wallet, voting power is 0 for owner
  if (!isAddressEqual(delegation.delegatee, ownerAddress)) {
    return BigInt(0)
  }

  // Get current timestamp in seconds
  const now = BigInt(Math.floor(Date.now() / 1000))

  // If lock expired, voting power is 0
  if (delegation.end <= now) {
    return BigInt(0)
  }

  // Calculate voting power: bias - (slope * timestamp)
  // Based on contract's _getDelegateVotesAt logic
  const voteDecay = delegation.slope * now
  const votingPower =
    delegation.bias > voteDecay ? delegation.bias - voteDecay : BigInt(0)

  return votingPower
}
