import { bitcoinTestnet, bitcoinMainnet } from 'btc-wallet/chains'

import { useNetworkType } from './useNetworkType'

export const useBitcoin = function () {
  const [type] = useNetworkType()
  return type === 'testnet' ? bitcoinTestnet : bitcoinMainnet
}
