// Subset of the Vetro Gateway ABI relevant to Hemi Earn. The portal only needs
// the preview reads; deposit/redeem are executed by the Hemi Earn Agent on the
// Ethereum side and are never called from the client.
export const gatewayAbi = [
  {
    inputs: [
      { name: 'tokenIn_', type: 'address' },
      { name: 'amountIn_', type: 'uint256' },
    ],
    name: 'previewDeposit',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenOut_', type: 'address' },
      { name: 'peggedTokenIn_', type: 'uint256' },
    ],
    name: 'previewRedeem',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'token_', type: 'address' }],
    name: 'mintFee',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'token_', type: 'address' }],
    name: 'redeemFee',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
