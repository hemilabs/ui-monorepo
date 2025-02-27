import { Address, Bytes } from '@graphprotocol/graph-ts'

export const zeroAddress = Bytes.fromHexString(Address.zero().toHexString())

const ethereumMainnetId = 1
const hemiMainnetId = 43111
const hemiSepoliaId = 743111
const sepoliaId = 11155111

const chainMap = new Map<string, i32>()
chainMap.set('mainnet', ethereumMainnetId)
chainMap.set('sepolia', sepoliaId)
chainMap.set('hemi', hemiMainnetId)
chainMap.set('hemi-sepolia', hemiSepoliaId)

export const getBitcoinChainId = (chainId: i32): string =>
  chainId === hemiSepoliaId ? 'testnet' : 'livenet'

export const getEthereumChainId = (l2ChainId: i32): i32 =>
  l2ChainId === hemiMainnetId ? ethereumMainnetId : sepoliaId

export const getEvmChainId = (chain: string): i32 => chainMap.get(chain)

export const getHemiChainId = (l1ChainId: i32): i32 =>
  l1ChainId === ethereumMainnetId ? hemiMainnetId : hemiSepoliaId
