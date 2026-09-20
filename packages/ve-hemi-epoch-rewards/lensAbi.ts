export const veHemiEpochRewardsLensAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'rewards_',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'allTokens',
    outputs: [
      {
        internalType: 'address[]',
        name: 'out',
        type: 'address[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'holder',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint32',
        name: 'fromEpoch',
        type: 'uint32',
      },
      {
        internalType: 'uint32',
        name: 'toEpoch',
        type: 'uint32',
      },
    ],
    name: 'claimableByEpoch',
    outputs: [
      {
        components: [
          {
            internalType: 'uint32',
            name: 'epoch',
            type: 'uint32',
          },
          {
            internalType: 'uint256',
            name: 'funded',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'claimable',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'resolved',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: 'swept',
            type: 'bool',
          },
        ],
        internalType: 'struct VeHemiEpochRewardsLens.EpochClaim[]',
        name: 'out',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'holder',
        type: 'address',
      },
      {
        internalType: 'uint32',
        name: 'fromEpoch',
        type: 'uint32',
      },
      {
        internalType: 'uint32',
        name: 'toEpoch',
        type: 'uint32',
      },
    ],
    name: 'claimableByToken',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'string',
            name: 'symbol',
            type: 'string',
          },
          {
            internalType: 'uint8',
            name: 'decimals',
            type: 'uint8',
          },
          {
            internalType: 'uint256',
            name: 'claimable',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'carry',
            type: 'uint256',
          },
        ],
        internalType: 'struct VeHemiEpochRewardsLens.TokenClaim[]',
        name: 'out',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'holder',
        type: 'address',
      },
    ],
    name: 'claimableByTokenAll',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'string',
            name: 'symbol',
            type: 'string',
          },
          {
            internalType: 'uint8',
            name: 'decimals',
            type: 'uint8',
          },
          {
            internalType: 'uint256',
            name: 'claimable',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'carry',
            type: 'uint256',
          },
        ],
        internalType: 'struct VeHemiEpochRewardsLens.TokenClaim[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint32',
        name: 'fromEpoch',
        type: 'uint32',
      },
      {
        internalType: 'uint32',
        name: 'toEpoch',
        type: 'uint32',
      },
    ],
    name: 'epochFunding',
    outputs: [
      {
        internalType: 'uint32[]',
        name: 'epochs',
        type: 'uint32[]',
      },
      {
        internalType: 'uint256[]',
        name: 'funded',
        type: 'uint256[]',
      },
      {
        internalType: 'uint256[]',
        name: 'claimed',
        type: 'uint256[]',
      },
      {
        internalType: 'bool[]',
        name: 'swept',
        type: 'bool[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint32',
        name: 'fromEpoch',
        type: 'uint32',
      },
      {
        internalType: 'uint32',
        name: 'toEpoch',
        type: 'uint32',
      },
    ],
    name: 'planClaim',
    outputs: [
      {
        internalType: 'uint32',
        name: 'chunkFrom',
        type: 'uint32',
      },
      {
        internalType: 'uint32',
        name: 'chunkTo',
        type: 'uint32',
      },
      {
        internalType: 'uint256',
        name: 'epochChunks',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'tokenPages',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'pageSize',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'rewards',
    outputs: [
      {
        internalType: 'contract VeHemiEpochRewards',
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
        internalType: 'uint32',
        name: 'epoch',
        type: 'uint32',
      },
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'streamsForEpoch',
    outputs: [
      {
        components: [
          {
            internalType: 'uint64',
            name: 'streamId',
            type: 'uint64',
          },
          {
            internalType: 'bytes32',
            name: 'label',
            type: 'bytes32',
          },
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'bool',
            name: 'closed',
            type: 'bool',
          },
          {
            internalType: 'uint256',
            name: 'funded',
            type: 'uint256',
          },
          {
            internalType: 'uint256[3]',
            name: 'fundedByClass',
            type: 'uint256[3]',
          },
        ],
        internalType: 'struct VeHemiEpochRewardsLens.StreamShare[]',
        name: 'out',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'systemState',
    outputs: [
      {
        components: [
          {
            internalType: 'uint32',
            name: 'currentEpoch',
            type: 'uint32',
          },
          {
            internalType: 'uint32',
            name: 'settledEpoch',
            type: 'uint32',
          },
          {
            internalType: 'uint32',
            name: 'firstFundableEpoch',
            type: 'uint32',
          },
          {
            internalType: 'uint256',
            name: 'epochLength',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'epochStartTime',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'paused',
            type: 'bool',
          },
          {
            internalType: 'uint256',
            name: 'pausedUntil',
            type: 'uint256',
          },
          {
            internalType: 'uint64',
            name: 'streamCount',
            type: 'uint64',
          },
          {
            internalType: 'uint256',
            name: 'maxClaimEpochs',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'maxTokensPerClaim',
            type: 'uint256',
          },
          {
            internalType: 'address[]',
            name: 'tokens',
            type: 'address[]',
          },
        ],
        internalType: 'struct VeHemiEpochRewardsLens.SystemState',
        name: 's',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        internalType: 'uint32',
        name: 'epoch',
        type: 'uint32',
      },
    ],
    name: 'weightAt',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'weight',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'owner',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'totalSupply',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'instant',
            type: 'uint256',
          },
          {
            internalType: 'uint8',
            name: 'class_',
            type: 'uint8',
          },
          {
            internalType: 'uint256',
            name: 'classDenominator',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'residualWeight',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'transferableDenominator',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'classKnown',
            type: 'bool',
          },
        ],
        internalType: 'struct VeHemiEpochRewardsLens.WeightAt',
        name: 'w',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const
