import { hemi, hemiSepolia } from 'hemi-viem'
import { type Address } from 'viem'

// Contract ABI for MerkleBox contract
export const merkleBoxAbi = [
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
      {
        internalType: 'uint32',
        name: 'lockupMonths',
        type: 'uint32',
      },
      {
        internalType: 'uint256',
        name: 'ratio',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
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
        internalType: 'uint32',
        name: '',
        type: 'uint32',
      },
    ],
    name: 'holdingToBonusSchedule',
    outputs: [
      {
        internalType: 'bool',
        name: 'enabled',
        type: 'bool',
      },
      {
        internalType: 'uint32',
        name: 'bonus',
        type: 'uint32',
      },
      {
        internalType: 'uint32',
        name: 'lockupRatio',
        type: 'uint32',
      },
      {
        internalType: 'address',
        name: 'mintedNFT',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
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
] as const

// Contract addresses by chain ID
const MerkleBoxAddresses: Record<number, Address> = {
  // Hemi Mainnet (chainId: TBD - will be updated when available)
  // 43111: '0x...', // placeholder
  [hemi.id]: '0x9Ab3660ceE733332785cEa09D1a4Ff222F31aE54',
  [hemiSepolia.id]: '0x38f4C4BD276b9C47b419FE27D4ED01C32c120cF4',
} as const

// Get MerkleBox contract address for a given chain ID
export const getMerkleBoxAddress = function (chainId: number): Address {
  const address = MerkleBoxAddresses[chainId]
  if (!address) {
    throw new Error(`MerkleBox contract not available for chain ${chainId}`)
  }
  return address
}
