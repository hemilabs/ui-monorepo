import { BtcChain, bitcoinChains } from '../chains'

export const isChainIdSupported = (chainId: BtcChain['id']) =>
  bitcoinChains.some(btcChain => btcChain.id === chainId)

export const isChainSupported = (chain: BtcChain) =>
  isChainIdSupported(chain.id)
