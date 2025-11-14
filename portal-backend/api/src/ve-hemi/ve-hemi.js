'use strict'

const { hemi, hemiSepolia } = require('viem/chains')
const { readContract } = require('viem/actions')

const veHemiAbi = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'timestamp_',
        type: 'uint256',
      },
    ],
    name: 'totalVeHemiSupplyAt',
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
]

const VE_HEMI_CONTRACT_ADDRESSES = {
  [hemi.id]: '0x371d3718D5b7F75EAb050FAe6Da7DF3092031c89',
  [hemiSepolia.id]: '0xd137b7B3510b23E98b6A9aC2acB5C8bb668AC82d', // MockVeHemi
}

const getVeHemiContractAddress = chainId => VE_HEMI_CONTRACT_ADDRESSES[chainId]

/**
 * @param {import('viem').Client} client
 * @param {number} timestamp
 */
const getTotalVeHemiSupplyAt = async (client, timestamp) =>
  /** @type {Promise<bigint>} */ (
    readContract(client, {
      abi: veHemiAbi,
      address: getVeHemiContractAddress(client.chain?.id),
      args: [timestamp],
      functionName: 'totalVeHemiSupplyAt',
    })
  )

module.exports = {
  getTotalVeHemiSupplyAt,
}
