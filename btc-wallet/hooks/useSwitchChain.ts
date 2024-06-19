import { useMutation } from '@tanstack/react-query'
import { useContext, useEffect } from 'react'

import { BtcChain } from '../chains'
import { GlobalContext } from '../context/globalContext'

import { useAccount } from './useAccount'
import { useConfig } from './useConfig'

export const useSwitchChain = function () {
  const { chainId } = useAccount()
  const { connectionStatus, currentConnector } = useContext(GlobalContext)
  const { chains: supportedChains } = useConfig()

  const {
    mutate: trySwitch,
    reset,
    status,
  } = useMutation({
    mutationFn: (chain: BtcChain) => currentConnector.switchNetwork(chain.id),
    mutationKey: ['btc-wallet', 'switch'],
  })

  useEffect(
    function listenForAccountChange() {
      if (!currentConnector) {
        return undefined
      }
      return currentConnector.onAccountsChanged(reset)
    },
    [currentConnector, reset],
  )

  const switchChain = function (chain: BtcChain) {
    if (!currentConnector || connectionStatus !== 'connected') {
      throw new Error('Not Connected')
    }
    if (!supportedChains.some(c => c.id === chain.id)) {
      throw new Error(`Unsupported chain ${chain.id}`)
    }
    if (chainId === chain.id) {
      // already connected - do nothing
      return
    }
    trySwitch(chain)
  }

  return {
    status,
    switchChain,
  }
}
