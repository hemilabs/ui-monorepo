import { useMutation } from '@tanstack/react-query'
import { useContext, useEffect } from 'react'

import { BtcChain } from '../chains'
import { GlobalContext } from '../context/globalContext'

import { useAccount } from './useAccount'
import { useConfig } from './useConfig'

export const useSwitchChain = function () {
  const { chainId: currentChainId } = useAccount()
  const { connectionStatus, currentConnector } = useContext(GlobalContext)
  const { chains: supportedChains } = useConfig()

  const {
    mutate: trySwitch,
    reset,
    status,
  } = useMutation({
    mutationFn: (c: BtcChain['id']) => currentConnector.switchNetwork(c),
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

  const switchChain = function ({ chainId }: { chainId: BtcChain['id'] }) {
    if (!currentConnector || connectionStatus !== 'connected') {
      throw new Error('Not Connected')
    }
    if (!supportedChains.some(c => c.id === chainId)) {
      throw new Error(`Unsupported chain ${chainId}`)
    }
    if (currentChainId === chainId) {
      // already connected - do nothing
      return
    }
    trySwitch(chainId)
  }

  return {
    status,
    switchChain,
  }
}
