import { allNetworks } from 'networks'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { type RemoteChain } from 'types/chain'
import { type Address, type Chain, type ChainContract } from 'viem'

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

export const getL1StandardBridgeAddress = (l1ChainId: Chain['id']) =>
  (
    getHemiForL1(l1ChainId).contracts?.l1StandardBridge as {
      [sourceId: number]: ChainContract
    }
  )?.[l1ChainId].address as Address

export const getL2BridgeAddress = (l1ChainId: Chain['id']) =>
  (
    getHemiForL1(l1ChainId).contracts?.l2Bridge as {
      [sourceId: number]: ChainContract
    }
  )?.[l1ChainId].address as Address
