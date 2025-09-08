import { allNetworks } from 'networks'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { type RemoteChain } from 'types/chain'
import { type Address, type Chain, zeroAddress } from 'viem'

export const findChainById = (chainId: RemoteChain['id']) =>
  allNetworks.find(n => n.id === chainId)

export const isBtcNetworkId = (chainId: RemoteChain['id']) =>
  typeof chainId === 'string'

export const isEvmNetworkId = (chainId: RemoteChain['id']) =>
  typeof chainId === 'number'

export const isEvmNetwork = (chain: RemoteChain): chain is Chain =>
  isEvmNetworkId(chain.id)

export const isL2NetworkId = (chainId: number) =>
  [hemiMainnet.id, hemiTestnet.id].includes(chainId)

export const isL2Network = (chain: Chain) => isL2NetworkId(chain.id)

export const getTunnelContracts = (l2Chain: Chain, l1ChainId: Chain['id']) => ({
  AddressManager: (process.env.NEXT_PUBLIC_ADDRESS_MANAGER ??
    // @ts-expect-error hemi has these contracts defined
    l2Chain.contracts.addressManager[l1ChainId].address) as Address,
  BondManager: zeroAddress,
  CanonicalTransactionChain: zeroAddress,
  L1CrossDomainMessenger: (process.env
    .NEXT_PUBLIC_PROXY_OVM_L1_CROSS_DOMAIN_MESSENGER ??
    // @ts-expect-error hemi has these contracts defined
    l2Chain.contracts.l1CrossDomainMessenger[l1ChainId].address) as Address,
  L1StandardBridge: (process.env.NEXT_PUBLIC_PROXY_OVM_L1_STANDARD_BRIDGE ??
    // @ts-expect-error hemi has these contracts defined
    l2Chain.contracts.l1StandardBridge[l1ChainId].address) as Address,
  L2Bridge: (process.env.NEXT_PUBLIC_L2_BRIDGE ??
    // @ts-expect-error hemi has these contracts defined
    l2Chain.contracts.l2Bridge[l1ChainId].address) as Address,
  L2OutputOracle: (process.env.NEXT_PUBLIC_L2_OUTPUT_ORACLE_PROXY ??
    // @ts-expect-error hemi has these contracts defined
    l2Chain.contracts.l2OutputOracle[l1ChainId].address) as Address,
  OptimismPortal: (process.env.NEXT_PUBLIC_OPTIMISM_PORTAL_PROXY ??
    // @ts-expect-error hemi has these contracts defined
    l2Chain.contracts.portal[l1ChainId].address) as Address,
  StateCommitmentChain: zeroAddress,
})
