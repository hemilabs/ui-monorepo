import { type SignerOrProviderLike } from '@eth-optimism/sdk'
import { hemi } from 'app/networks'
import { type Address, type Chain, zeroAddress } from 'viem'

const sdkPromise = import('@eth-optimism/sdk')

// Read contracts from chain definition, but allow overriding them from .env variables.
// Useful when using a devnet or a short-lived fork of the chain.
export const getTunnelContracts = (l1ChainId: Chain['id']) => ({
  AddressManager: (process.env.NEXT_PUBLIC_ADDRESS_MANAGER ??
    hemi.contracts.addressManager[l1ChainId].address) as Address,
  BondManager: zeroAddress,
  CanonicalTransactionChain: zeroAddress,
  L1CrossDomainMessenger: (process.env
    .NEXT_PUBLIC_PROXY_OVM_L1_CROSS_DOMAIN_MESSENGER ??
    hemi.contracts.l1CrossDomainMessenger[l1ChainId].address) as Address,
  L1StandardBridge: (process.env.NEXT_PUBLIC_PROXY_OVM_L1_STANDARD_BRIDGE ??
    hemi.contracts.l1StandardBridge[l1ChainId].address) as Address,
  L2Bridge: (process.env.NEXT_PUBLIC_L2_BRIDGE ??
    hemi.contracts.l2Bridge[l1ChainId].address) as Address,
  L2OutputOracle: (process.env.NEXT_PUBLIC_L2_OUTPUT_ORACLE_PROXY ??
    hemi.contracts.l2OutputOracle[l1ChainId].address) as Address,
  OptimismPortal: (process.env.NEXT_PUBLIC_OPTIMISM_PORTAL_PROXY ??
    hemi.contracts.portal[l1ChainId].address) as Address,
  StateCommitmentChain: zeroAddress,
})

export async function getCrossChainMessenger({
  l1ChainId,
  l1Signer,
  l2Signer,
}: {
  l1ChainId: Chain['id']
  l1Signer: SignerOrProviderLike
  l2Signer: SignerOrProviderLike
}) {
  const { CrossChainMessenger, ETHBridgeAdapter, StandardBridgeAdapter } =
    await sdkPromise

  const l1Contracts = getTunnelContracts(l1ChainId)
  return new CrossChainMessenger({
    bedrock: true,
    bridges: {
      ETH: {
        Adapter: ETHBridgeAdapter,
        l1Bridge: l1Contracts.L1StandardBridge,
        l2Bridge: l1Contracts.L2Bridge,
      },
      Standard: {
        Adapter: StandardBridgeAdapter,
        l1Bridge: l1Contracts.L1StandardBridge,
        l2Bridge: l1Contracts.L2Bridge,
      },
    },
    contracts: {
      l1: l1Contracts,
    },
    l1ChainId,
    l1SignerOrProvider: l1Signer,
    l2ChainId: hemi.id,
    l2SignerOrProvider: l2Signer,
  })
}
