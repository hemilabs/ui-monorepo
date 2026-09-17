// Vendored verbatim from the veHEMI rewards handoff bundle:
//   vehemi-rewards-ui-handoff-v2/abi/VeHemiEpochRewardsLens.json
// base commit c6a65c74154377e8720f584b364bdc109fbdedc5, console sha256 c497caecc880f994
// (see PROVENANCE.txt in that bundle: ABI entry count 11, hash 97517df6cdd73e11).
// Do not hand-edit. Re-cut the bundle and regenerate if the contract changes.
//
// The v2 bundle left this ABI byte-identical, so nothing here moved. Its IMPLEMENTATION
// did (creation code 9605 -> 9614 bytes, hash 0a11b106601864ae -> bb932b827094e87c),
// which is consistent with the argument-order change on the rewards contract reaching
// the Lens's own call sites - see `epochRewardsAbi.ts`. Same interface, a redeployed
// contract: the figures are worth re-checking against a fresh deployment, but no call
// here changes.
//
// The Lens is a read aggregator over VeHemiEpochRewards: view-only, holds no funds and
// is redeployable. Every monetary figure it returns is `rewards.preview(...)` verbatim -
// it is never a second implementation. Read through the Lens, write through the rewards
// contract, and if a number is missing here, add a Lens method rather than recomputing a
// share locally: a second copy of the arithmetic drifts, and holders find out when they
// claim.
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
