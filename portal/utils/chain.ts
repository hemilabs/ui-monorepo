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

const getHemiForL1 = (l1ChainId: Chain['id']) =>
  findChainById(l1ChainId)?.testnet ? hemiTestnet : hemiMainnet

const getTunnelContracts = (l2Chain: Chain, l1ChainId: Chain['id']) => ({
  AddressManager: (import.meta.env.VITE_ADDRESS_MANAGER ||
    // @ts-expect-error hemi has these contracts defined
    l2Chain.contracts.addressManager[l1ChainId].address) as Address,
  BondManager: zeroAddress,
  CanonicalTransactionChain: zeroAddress,
  L1CrossDomainMessenger: (import.meta.env
    .VITE_PROXY_OVM_L1_CROSS_DOMAIN_MESSENGER ||
    // @ts-expect-error hemi has these contracts defined
    l2Chain.contracts.l1CrossDomainMessenger[l1ChainId].address) as Address,
  L1StandardBridge: (import.meta.env.VITE_PROXY_OVM_L1_STANDARD_BRIDGE ||
    // @ts-expect-error hemi has these contracts defined
    l2Chain.contracts.l1StandardBridge[l1ChainId].address) as Address,
  L2Bridge: (import.meta.env.VITE_L2_BRIDGE ||
    // @ts-expect-error hemi has these contracts defined
    l2Chain.contracts.l2Bridge[l1ChainId].address) as Address,
  L2OutputOracle: (import.meta.env.VITE_L2_OUTPUT_ORACLE_PROXY ||
    // @ts-expect-error hemi has these contracts defined
    l2Chain.contracts.l2OutputOracle[l1ChainId].address) as Address,
  OptimismPortal: (import.meta.env.VITE_OPTIMISM_PORTAL_PROXY ||
    // @ts-expect-error hemi has these contracts defined
    l2Chain.contracts.portal[l1ChainId].address) as Address,
  StateCommitmentChain: zeroAddress,
})

export const getL1StandardBridgeAddress = (l1ChainId: Chain['id']) =>
  getTunnelContracts(getHemiForL1(l1ChainId), l1ChainId).L1StandardBridge

export const getL2BridgeAddress = (l1ChainId: Chain['id']) =>
  getTunnelContracts(getHemiForL1(l1ChainId), l1ChainId).L2Bridge
