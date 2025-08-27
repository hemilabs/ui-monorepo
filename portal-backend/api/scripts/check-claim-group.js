'use strict'

const {
  createPublicClient,
  encodeAbiParameters,
  http,
  keccak256,
  parseAbiParameters,
} = require('viem')
// eslint-disable-next-line no-unused-vars
const { hemi, hemiSepolia } = require('viem/chains')
const { readContract } = require('viem/actions')
const pMap = require('p-map')

/**
 * @typedef {`0x{string}`} Address
 * @typedef {{ amount: string, claimGroupId: number, proof: string[] }} ClaimData
 */

const chain = hemi // hemiSepolia
const claimGroupId = 14

const contractAddress =
  // @ts-ignore
  chain.id === hemi.id
    ? '0x9Ab3660ceE733332785cEa09D1a4Ff222F31aE54'
    : '0x1e1d3D4e58B15AAF85067ad2ABafD2c022b2DB93'
const contractAbi = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'claimGroupId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'bytes32[]',
        name: 'proof',
        type: 'bytes32[]',
      },
    ],
    name: 'isClaimable',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
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
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    name: 'leafClaimed',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

const client = createPublicClient({ chain, transport: http() })

let claimable = 0
let claimed = 0
let error = 0

let amountClaimed = BigInt(0)
let amountClaimable = BigInt(0)

function printStats() {
  const total = amountClaimable + amountClaimed
  const amountPct =
    total > 0 ? Number((BigInt(100) * amountClaimed) / total) : 0
  console.log({ amountPct, claimable, claimed, error })
}

const interval = setInterval(printStats, 1000)

/**
 *
 * @param {Address} address
 * @param {ClaimData} data
 * @returns
 */
async function checkClaim(address, data) {
  const abiEncoded = encodeAbiParameters(
    parseAbiParameters('address, uint256'),
    [address, BigInt(data.amount)],
  )
  const leafHash = keccak256(keccak256(abiEncoded))
  const alreadyClaimed = await readContract(client, {
    abi: contractAbi,
    address: contractAddress,
    args: [BigInt(claimGroupId), leafHash],
    functionName: 'leafClaimed',
  })
  if (alreadyClaimed) {
    claimed++
    amountClaimed += BigInt(data.amount)
    return
  }

  const isClaimable = await readContract(client, {
    abi: contractAbi,
    address: contractAddress,
    args: [BigInt(claimGroupId), address, BigInt(data.amount), data.proof],
    functionName: 'isClaimable',
  })
  if (!isClaimable) {
    error++
  } else {
    claimable++
    amountClaimable += BigInt(data.amount)
  }
}

async function checkAll() {
  const claimData = require(
    `../src/claims-data/${chain.id}-${claimGroupId}.json`,
  )
  await pMap(
    /** @type {Address[]} */ (Object.keys(claimData)),
    address => checkClaim(address, claimData[address]),
    { concurrency: 25 },
  )
  clearInterval(interval)
  printStats()
  console.log('Done')
}

checkAll()
