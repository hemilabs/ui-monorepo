// exporting as const to get wagmi's type safety and inference
export const custodianVaultAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_owner',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_operator',
        type: 'address',
      },
      {
        internalType: 'contract IBitcoinKit',
        name: '_bitcoinKitContract',
        type: 'address',
      },
      {
        internalType: 'string',
        name: '_bitcoinAddress',
        type: 'string',
      },
      {
        internalType: 'contract ERC20',
        name: '_collateralAssetContract',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'txid',
        type: 'bytes32',
      },
    ],
    name: 'DepositInvalidOpReturnNotPopulated',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'invalidOperator',
        type: 'address',
      },
    ],
    name: 'InvalidAuthorizedOperator',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'invalidOwner',
        type: 'address',
      },
    ],
    name: 'InvalidAuthorizedOwner',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'invalidBitcoinAddress',
        type: 'string',
      },
    ],
    name: 'InvalidBitcoinAddress',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'unauthorizedOperator',
        type: 'address',
      },
    ],
    name: 'UnauthorizedOperator',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    name: 'acknowledgedDeposits',
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
    name: 'bitcoinCustodyAddress',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'bitcoinKitContract',
    outputs: [
      {
        internalType: 'contract IBitcoinKit',
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
        internalType: 'bytes',
        name: '_input',
        type: 'bytes',
      },
    ],
    name: 'bytesToAddress',
    outputs: [
      {
        internalType: 'address',
        name: 'addr',
        type: 'address',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_txid',
        type: 'bytes32',
      },
    ],
    name: 'confirmDeposit',
    outputs: [
      {
        internalType: 'bool',
        name: 'success',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: 'satsDeposited',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'tunnelDestination',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'depositCollateral',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint8',
        name: 'c',
        type: 'uint8',
      },
    ],
    name: 'fromHexChar',
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getBitcoinCustodyAddress',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getEffectiveCollateralBalance',
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
    name: 'getOperator',
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
        internalType: 'bytes',
        name: 'source',
        type: 'bytes',
      },
      {
        internalType: 'uint256',
        name: 'startIndex',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'endIndex',
        type: 'uint256',
      },
    ],
    name: 'hexAsciiBytesToBytes',
    outputs: [
      {
        internalType: 'bytes',
        name: 'result',
        type: 'bytes',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_txid',
        type: 'bytes32',
      },
    ],
    name: 'isDepositAlreadyConfirmed',
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
    name: 'operator',
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
    name: 'recoverIncorrectDeposits',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdrawCollateral',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
