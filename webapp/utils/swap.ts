import { NetworkType } from 'hooks/useNetworkType'

export const getSwapUrl = (networkType: NetworkType) =>
  networkType === 'testnet'
    ? 'https://swap.hemi.xyz'
    : 'https://www.sushi.com/hemi/swap'
