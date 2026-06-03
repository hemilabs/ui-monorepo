// ABI subset for the Hemi Earn Agent (Ethereum-side). Only the read functions
// the portal needs to call directly are bound here; write paths
// (handleDepositRequest, handleRedeemRequest, retry, cancel, claimUnstake)
// are triggered by LayerZero composes (or keepers) and never invoked from the
// client.
export const agentAbi = [
  {
    // Quotes the LZ native fee for the fulfillment OFT back to Hemi. The
    // param is the **Ethereum-side staking vault (sVetToken)** address —
    // since the `Stateless Agent` refactor the Agent no longer resolves
    // share-from-asset internally, so the caller must supply it.
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
] as const
