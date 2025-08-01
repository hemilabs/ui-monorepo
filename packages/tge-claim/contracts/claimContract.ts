import { hemiSepolia } from 'hemi-viem'
import { type Address } from 'viem'

// Contract ABI for TGE Claim contract
export const tgeClaimAbi = [
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
const TGE_CLAIM_ADDRESSES: Record<number, Address> = {
  // Hemi Mainnet (chainId: TBD - will be updated when available)
  // 43111: '0x...', // placeholder
  [hemiSepolia.id]: '0xE987f93C1e8cC326D5aCF9352c63ffe639B84161',
} as const

// Get TGE claim contract address for a given chain ID
export const getTgeClaimAddress = function (chainId: number): Address {
  const address = TGE_CLAIM_ADDRESSES[chainId]
  if (!address) {
    throw new Error(`TGE Claim contract not available for chain ${chainId}`)
  }
  return address
}
