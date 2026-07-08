export const agentAbi = [
  {
    inputs: [{ internalType: 'uint256', name: 'requestId_', type: 'uint256' }],
    name: 'claimUnstake',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    // share_ is the Ethereum staking vault (sVetToken), not the Hemi share OFT.
    inputs: [{ internalType: 'address', name: 'share_', type: 'address' }],
    name: 'quoteDepositFulfillment',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'asset_', type: 'address' }],
    name: 'quoteRedeemFulfillment',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'unstakeRequests',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'share', type: 'address' },
          { internalType: 'uint256', name: 'shares', type: 'uint256' },
          { internalType: 'address', name: 'asset', type: 'address' },
          { internalType: 'address', name: 'operator', type: 'address' },
          { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' },
          { internalType: 'uint256', name: 'nativeFee', type: 'uint256' },
          {
            internalType: 'uint256',
            name: 'unstakingRequestId',
            type: 'uint256',
          },
          { internalType: 'uint256', name: 'claimableAt', type: 'uint256' },
        ],
        internalType: 'struct Agent.UnstakeRequest',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const
