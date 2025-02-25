import { hemi, hemiSepolia } from 'hemi-viem'
import { type Address, type Chain } from 'viem'

export const stakeManagerAddresses: Record<Chain['id'], Address> = {
  [hemi.id]: '0x4F5E928763CBFaF5fFD8907ebbB0DAbd5f78bA83',
  [hemiSepolia.id]: '0x935CC431313C52427ccf45385138a136580bf59f',
}

export const stakeManagerAbi = [
  {
    inputs: [
      {
        internalType: 'address[]',
        name: '_tokensAllowed',
        type: 'address[]',
      },
      {
        internalType: 'address',
        name: '_weth',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'ArrayLengthCannotBeZero',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ArrayLengthNotMatch',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ArrayLengthsDoNotMatch',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes',
        name: 'result',
        type: 'bytes',
      },
    ],
    name: 'CallExecutionFailed',
    type: 'error',
  },
  {
    inputs: [],
    name: 'CannotDepositForZeroAddress',
    type: 'error',
  },
  {
    inputs: [],
    name: 'CannotRenounceOwnership',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ContractAddressCannotBeZeroAddress',
    type: 'error',
  },
  {
    inputs: [],
    name: 'DepositAmountCannotBeZero',
    type: 'error',
  },
  {
    inputs: [],
    name: 'DuplicateToken',
    type: 'error',
  },
  {
    inputs: [],
    name: 'EnforcedPause',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ExpectedPause',
    type: 'error',
  },
  {
    inputs: [],
    name: 'FunctionAlreadyWhitelisted',
    type: 'error',
  },
  {
    inputs: [],
    name: 'FunctionNotWhitelisted',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'currentNonce',
        type: 'uint256',
      },
    ],
    name: 'InvalidAccountNonce',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidMerkleProof',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidShortString',
    type: 'error',
  },
  {
    inputs: [],
    name: 'LeafAlreadyClaimed',
    type: 'error',
  },
  {
    inputs: [],
    name: 'LeafAmountCannotBeZero',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MerkleRootAlreadySet',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MerkleRootCannotBeSetToZero',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MerkleRootDisabledForClaiming',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MerkleRootIndexCannotBeZero',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MerkleRootNotSet',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MerkleRootStatusAlreadySet',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ReentrancyGuardReentrantCall',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'requestedTokens',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'totalBalance',
        type: 'uint256',
      },
    ],
    name: 'RemainingTokensLessThanTotalBalance',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'SafeERC20FailedOperation',
    type: 'error',
  },
  {
    inputs: [],
    name: 'SignatureExpired',
    type: 'error',
  },
  {
    inputs: [],
    name: 'SignatureInvalid',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'str',
        type: 'string',
      },
    ],
    name: 'StringTooLong',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TokenAlreadyConfiguredWithState',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TokenArrayCannotBeEmpty',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TokenCannotBeZeroAddress',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TokenNotAllowedForStaking',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TransferAmountCannotBeMoreThanLeafAmount',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TransferAmountCannotBeZero',
    type: 'error',
  },
  {
    inputs: [],
    name: 'UserArrayCannotBeEmpty',
    type: 'error',
  },
  {
    inputs: [],
    name: 'UserDoesNotHaveStake',
    type: 'error',
  },
  {
    inputs: [],
    name: 'WETHCannotBeZeroAddress',
    type: 'error',
  },
  {
    inputs: [],
    name: 'WithdrawAmountCannotBeZero',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'migrator',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'blocked',
        type: 'bool',
      },
    ],
    name: 'BlocklistChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'eventId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'depositor',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Deposit',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'EIP712DomainChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'contractAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes4',
        name: 'functionSignature',
        type: 'bytes4',
      },
    ],
    name: 'FunctionAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'contractAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes4',
        name: 'functionSignature',
        type: 'bytes4',
      },
    ],
    name: 'FunctionRemoved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'merkleRoot',
        type: 'bytes32',
      },
    ],
    name: 'MerkleRootSet',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'contractAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes4',
        name: 'functionSignature',
        type: 'bytes4',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
      {
        indexed: false,
        internalType: 'address[]',
        name: 'tokens',
        type: 'address[]',
      },
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'amountsSpent',
        type: 'uint256[]',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'eventId',
        type: 'uint256',
      },
    ],
    name: 'MoveToDapp',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'contractAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes4',
        name: 'functionSignature',
        type: 'bytes4',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
      {
        indexed: false,
        internalType: 'address[]',
        name: 'tokens',
        type: 'address[]',
      },
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'amountsSpent',
        type: 'uint256[]',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'eventId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'rootIndex',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'leafAmounts',
        type: 'uint256[]',
      },
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'migrationEventIds',
        type: 'uint256[]',
      },
    ],
    name: 'MoveToDappMerkle',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferStarted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'Paused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'disabled',
        type: 'bool',
      },
    ],
    name: 'RootStatusSet',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'leaf',
        type: 'bytes32',
      },
    ],
    name: 'SetLeafClaimed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'enabled',
        type: 'bool',
      },
    ],
    name: 'TokenStakabilityChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'Unpaused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'eventId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'withdrawer',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Withdraw',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'rootIndex',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address[]',
        name: 'tokens',
        type: 'address[]',
      },
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'leafAmounts',
        type: 'uint256[]',
      },
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'transferAmounts',
        type: 'uint256[]',
      },
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'migrationEventIds',
        type: 'uint256[]',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'eventId',
        type: 'uint256',
      },
    ],
    name: 'WithdrawMerkle',
    type: 'event',
  },
  {
    inputs: [],
    name: 'MOVE_TO_DAPP_MERKLE_TYPEHASH',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MOVE_TO_DAPP_TYPEHASH',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'acceptOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_contractAddress',
        type: 'address',
      },
      {
        internalType: 'bytes4',
        name: '_functionSignature',
        type: 'bytes4',
      },
    ],
    name: 'addFunction',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'balance',
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
        internalType: 'address[]',
        name: '_tokens',
        type: 'address[]',
      },
      {
        internalType: 'address[]',
        name: '_for',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: '_amounts',
        type: 'uint256[]',
      },
    ],
    name: 'batchDepositFor',
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
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    name: 'claimed',
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
        internalType: 'address',
        name: '_for',
        type: 'address',
      },
    ],
    name: 'depositETHFor',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_token',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_for',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256',
      },
    ],
    name: 'depositFor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'eip712Domain',
    outputs: [
      {
        internalType: 'bytes1',
        name: 'fields',
        type: 'bytes1',
      },
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'version',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'chainId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'verifyingContract',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: 'salt',
        type: 'bytes32',
      },
      {
        internalType: 'uint256[]',
        name: 'extensions',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'eventId',
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
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'bytes4',
        name: '',
        type: 'bytes4',
      },
    ],
    name: 'functionAllowlist',
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
    ],
    name: 'merkleRootDisabled',
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
    ],
    name: 'merkleRoots',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'contractAddress',
            type: 'address',
          },
          {
            internalType: 'bytes4',
            name: 'functionSignature',
            type: 'bytes4',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
          {
            internalType: 'address[]',
            name: 'tokens',
            type: 'address[]',
          },
          {
            internalType: 'uint256[]',
            name: 'amounts',
            type: 'uint256[]',
          },
        ],
        internalType: 'struct ILaunchPool.ContractCall',
        name: '_contractCall',
        type: 'tuple',
      },
    ],
    name: 'moveToDapp',
    outputs: [
      {
        components: [
          {
            internalType: 'address[]',
            name: 'tokens',
            type: 'address[]',
          },
          {
            internalType: 'uint256[]',
            name: 'amounts',
            type: 'uint256[]',
          },
          {
            internalType: 'bytes',
            name: 'result',
            type: 'bytes',
          },
        ],
        internalType: 'struct ILaunchPool.CallResult',
        name: 'result',
        type: 'tuple',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'contractAddress',
            type: 'address',
          },
          {
            internalType: 'bytes4',
            name: 'functionSignature',
            type: 'bytes4',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
          {
            components: [
              {
                internalType: 'uint256',
                name: 'rootIndex',
                type: 'uint256',
              },
              {
                internalType: 'address[]',
                name: 'tokens',
                type: 'address[]',
              },
              {
                internalType: 'uint256[]',
                name: 'leafAmounts',
                type: 'uint256[]',
              },
              {
                internalType: 'uint256[]',
                name: 'transferAmounts',
                type: 'uint256[]',
              },
              {
                internalType: 'bytes32[][]',
                name: 'proofs',
                type: 'bytes32[][]',
              },
              {
                internalType: 'uint256[]',
                name: 'migrationEventIds',
                type: 'uint256[]',
              },
            ],
            internalType: 'struct ILaunchPool.MerkleClaim',
            name: 'claim',
            type: 'tuple',
          },
        ],
        internalType: 'struct ILaunchPool.ContractCallMerkle',
        name: '_contractCall',
        type: 'tuple',
      },
    ],
    name: 'moveToDappMerkle',
    outputs: [
      {
        components: [
          {
            internalType: 'address[]',
            name: 'tokens',
            type: 'address[]',
          },
          {
            internalType: 'uint256[]',
            name: 'amounts',
            type: 'uint256[]',
          },
          {
            internalType: 'bytes',
            name: 'result',
            type: 'bytes',
          },
        ],
        internalType: 'struct ILaunchPool.CallResult',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: '_users',
        type: 'address[]',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'contractAddress',
            type: 'address',
          },
          {
            internalType: 'bytes4',
            name: 'functionSignature',
            type: 'bytes4',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
          {
            components: [
              {
                internalType: 'uint256',
                name: 'rootIndex',
                type: 'uint256',
              },
              {
                internalType: 'address[]',
                name: 'tokens',
                type: 'address[]',
              },
              {
                internalType: 'uint256[]',
                name: 'leafAmounts',
                type: 'uint256[]',
              },
              {
                internalType: 'uint256[]',
                name: 'transferAmounts',
                type: 'uint256[]',
              },
              {
                internalType: 'bytes32[][]',
                name: 'proofs',
                type: 'bytes32[][]',
              },
              {
                internalType: 'uint256[]',
                name: 'migrationEventIds',
                type: 'uint256[]',
              },
            ],
            internalType: 'struct ILaunchPool.MerkleClaim',
            name: 'claim',
            type: 'tuple',
          },
        ],
        internalType: 'struct ILaunchPool.ContractCallMerkle[]',
        name: '_contractCalls',
        type: 'tuple[]',
      },
      {
        internalType: 'uint256[]',
        name: '_signatureExpiries',
        type: 'uint256[]',
      },
      {
        internalType: 'bytes[]',
        name: '_signatures',
        type: 'bytes[]',
      },
    ],
    name: 'moveToDappMerkleWithSig',
    outputs: [
      {
        components: [
          {
            internalType: 'address[]',
            name: 'tokens',
            type: 'address[]',
          },
          {
            internalType: 'uint256[]',
            name: 'amounts',
            type: 'uint256[]',
          },
          {
            internalType: 'bytes',
            name: 'result',
            type: 'bytes',
          },
        ],
        internalType: 'struct ILaunchPool.CallResult[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: '_users',
        type: 'address[]',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'contractAddress',
            type: 'address',
          },
          {
            internalType: 'bytes4',
            name: 'functionSignature',
            type: 'bytes4',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
          {
            internalType: 'address[]',
            name: 'tokens',
            type: 'address[]',
          },
          {
            internalType: 'uint256[]',
            name: 'amounts',
            type: 'uint256[]',
          },
        ],
        internalType: 'struct ILaunchPool.ContractCall[]',
        name: '_contractCalls',
        type: 'tuple[]',
      },
      {
        internalType: 'uint256[]',
        name: '_signatureExpiries',
        type: 'uint256[]',
      },
      {
        internalType: 'bytes[]',
        name: '_signatures',
        type: 'bytes[]',
      },
    ],
    name: 'moveToDappWithSig',
    outputs: [
      {
        components: [
          {
            internalType: 'address[]',
            name: 'tokens',
            type: 'address[]',
          },
          {
            internalType: 'uint256[]',
            name: 'amounts',
            type: 'uint256[]',
          },
          {
            internalType: 'bytes',
            name: 'result',
            type: 'bytes',
          },
        ],
        internalType: 'struct ILaunchPool.CallResult[]',
        name: '',
        type: 'tuple[]',
      },
    ],
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
    ],
    name: 'nonces',
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
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
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
    inputs: [],
    name: 'pendingOwner',
    outputs: [
      {
        internalType: 'address',
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
        internalType: 'address',
        name: '_contractAddress',
        type: 'address',
      },
      {
        internalType: 'bytes4',
        name: '_functionSignature',
        type: 'bytes4',
      },
    ],
    name: 'removeFunction',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_index',
        type: 'uint256',
      },
      {
        internalType: 'bytes32',
        name: '_leaf',
        type: 'bytes32',
      },
    ],
    name: 'setLeafClaimed',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_index',
        type: 'uint256',
      },
      {
        internalType: 'bytes32',
        name: '_merkleRoot',
        type: 'bytes32',
      },
    ],
    name: 'setMerkleRoot',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_index',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: '_disabled',
        type: 'bool',
      },
    ],
    name: 'setRootStatus',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_token',
        type: 'address',
      },
      {
        internalType: 'bool',
        name: '_canStake',
        type: 'bool',
      },
    ],
    name: 'setStakable',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'tokenAllowlist',
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
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'totalBalance',
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
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'weth',
    outputs: [
      {
        internalType: 'address',
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
        internalType: 'address',
        name: '_token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256',
      },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'rootIndex',
            type: 'uint256',
          },
          {
            internalType: 'address[]',
            name: 'tokens',
            type: 'address[]',
          },
          {
            internalType: 'uint256[]',
            name: 'leafAmounts',
            type: 'uint256[]',
          },
          {
            internalType: 'uint256[]',
            name: 'transferAmounts',
            type: 'uint256[]',
          },
          {
            internalType: 'bytes32[][]',
            name: 'proofs',
            type: 'bytes32[][]',
          },
          {
            internalType: 'uint256[]',
            name: 'migrationEventIds',
            type: 'uint256[]',
          },
        ],
        internalType: 'struct ILaunchPool.MerkleClaim',
        name: '_claim',
        type: 'tuple',
      },
    ],
    name: 'withdrawMerkle',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
