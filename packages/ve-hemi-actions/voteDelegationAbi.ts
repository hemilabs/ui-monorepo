export const veHemiVoteDelegationAbi = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'getVotes',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId_', type: 'uint256' }],
    name: 'delegation',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'delegatee', type: 'address' },
          { internalType: 'uint48', name: 'end', type: 'uint48' },
          { internalType: 'uint96', name: 'bias', type: 'uint96' },
          { internalType: 'uint96', name: 'amount', type: 'uint96' },
          { internalType: 'uint64', name: 'slope', type: 'uint64' },
        ],
        internalType: 'struct VeHemiDelegationStorageV1.Delegation',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const
