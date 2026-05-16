// ABI subset for the Hemi Earn Agent (Ethereum-side). Only the read functions
// the portal needs to call directly are bound here; write paths
// (handleDepositRequest, handleRedeemRequest, retry, undo) are triggered by
// LayerZero composes and never invoked from the client.
export const agentAbi = [
  {
    inputs: [{ internalType: 'address', name: 'asset_', type: 'address' }],
    name: 'quoteDepositFulfilment',
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
    inputs: [{ internalType: 'address', name: 'asset', type: 'address' }],
    name: 'assetsData',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
