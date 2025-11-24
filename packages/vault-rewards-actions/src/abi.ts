export const poolRewardsAbi = [
  {
    inputs: [{ internalType: 'address', name: 'account_', type: 'address' }],
    name: 'claimable',
    outputs: [
      {
        internalType: 'address[]',
        name: '_rewardTokens',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: '_claimableAmounts',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account_', type: 'address' }],
    name: 'claimReward',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
