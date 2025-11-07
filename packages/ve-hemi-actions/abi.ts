export const veHemiAbi = [
  {
    inputs: [],
    name: 'HEMI',
    outputs: [
      {
        internalType: 'contract IERC20',
        name: '',
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
        name: 'tokenId_',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'timestamp_',
        type: 'uint256',
      },
    ],
    name: 'balanceAndOwnerOfNFTAt',
    outputs: [
      {
        internalType: 'uint256',
        name: '_balance',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: '_owner',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
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
        name: 'amount_',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'lockDuration_',
        type: 'uint256',
      },
    ],
    name: 'createLock',
    outputs: [
      {
        internalType: 'uint256',
        name: '_tokenId',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId_',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amount_',
        type: 'uint256',
      },
    ],
    name: 'increaseAmount',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId_',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'lockDuration_',
        type: 'uint256',
      },
    ],
    name: 'increaseUnlockTime',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
    ],
    name: 'tokenOfOwnerByIndex',
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
      { indexed: true, name: 'provider', type: 'address' },
      { indexed: true, name: 'account', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'value', type: 'uint256' },
      { indexed: false, name: 'ts', type: 'uint256' },
      { indexed: false, name: 'lockDuration', type: 'uint256' },
      { indexed: false, name: 'type', type: 'uint256' },
      { indexed: false, name: 'transferable', type: 'bool' },
      { indexed: false, name: 'forfeitable', type: 'bool' },
    ],
    name: 'Lock',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId_', type: 'uint256' }],
    name: 'getLockedBalance',
    outputs: [
      {
        components: [
          { internalType: 'int128', name: 'amount', type: 'int128' },
          { internalType: 'uint64', name: 'end', type: 'uint64' },
        ],
        internalType: 'struct IVeHemi.LockedBalance',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId_', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId_', type: 'uint256' },
      { internalType: 'uint256', name: 'timestamp_', type: 'uint256' },
    ],
    name: 'balanceOfNFTAt',
    outputs: [{ internalType: 'uint256', name: '_balance', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'timestamp_', type: 'uint256' }],
    name: 'totalVeHemiSupplyAt',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_timestamp', type: 'uint256' }],
    name: 'totalSupplyAt',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
