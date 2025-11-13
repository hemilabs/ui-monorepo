'use strict'

const { hemi, hemiSepolia } = require('viem/chains')
const { readContract } = require('viem/actions')

const veHemiRewardsAbi = [
  {
    inputs: [],
    name: 'numRewardTokens',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'rewardPeriods',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'rewardTokens',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

const VE_HEMI_REWARDS_CONTRACT_ADDRESSES = {
  [hemi.id]: '0x0d85B6676d499c05FE06fcB6A3b620334Eb8012F',
  [hemiSepolia.id]: '0xa6c5DE7512521Cb8d4c6bBA45dF9bbb280aB276d',
}

const getVeHemiRewardsContractAddress = chainId =>
  VE_HEMI_REWARDS_CONTRACT_ADDRESSES[chainId]

/**
 * @param {import('viem').Client} client
 * @param {import('viem').Address} token
 * @param {number} timestamp
 */
const getRewardPeriod = async (client, token, timestamp) =>
  /** @type {Promise<bigint>} */ (
    readContract(client, {
      abi: veHemiRewardsAbi,
      address: getVeHemiRewardsContractAddress(client.chain?.id),
      args: [token, timestamp],
      functionName: 'rewardPeriods',
    })
  )

/**
 * @param {import('viem').Client} client
 */
async function getRewardTokens(client) {
  const address = getVeHemiRewardsContractAddress(client.chain?.id)
  const numTokens = await readContract(client, {
    abi: veHemiRewardsAbi,
    address,
    args: [],
    functionName: 'numRewardTokens',
  })
  const tokenAddresses = await Promise.all(
    Array.from(
      { length: Number(numTokens) },
      (_, i) =>
        /** @type {Promise<import('viem').Address>} */ (
          readContract(client, {
            abi: veHemiRewardsAbi,
            address,
            args: [BigInt(i)],
            functionName: 'rewardTokens',
          })
        ),
    ),
  )
  return tokenAddresses
}

module.exports = {
  getRewardPeriod,
  getRewardTokens,
}
