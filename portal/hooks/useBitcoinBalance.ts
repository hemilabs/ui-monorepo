import { bitcoinMainnet, bitcoinTestnet } from 'btc-wallet/chains'
import { useAccount } from 'btc-wallet/hooks/useAccount'
import { useBalance as useBtcBalance } from 'btc-wallet/hooks/useBalance'

import { useNetworkType } from './useNetworkType'

export const useBitcoinBalance = function () {
  const { chainId } = useAccount()
  const [networkType] = useNetworkType()

  const btcChain = networkType === 'mainnet' ? bitcoinMainnet : bitcoinTestnet

  return useBtcBalance({
    enabled: btcChain.id === chainId,
  })
}
