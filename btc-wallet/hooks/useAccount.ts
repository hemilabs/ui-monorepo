import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useContext, useEffect, useMemo } from 'react'

import { bitcoinChains } from '../chains'
import { GlobalContext } from '../context/globalContext'

import { getAccountsQueryKey, getNetworksQueryKey } from './queryKeys'
import { useConfig } from './useConfig'

export const useAccount = function () {
  const { chains: supportedChains } = useConfig()
  const { connectionStatus, currentConnector } = useContext(GlobalContext)

  const accountQueryKey = useMemo(
    () => getAccountsQueryKey(currentConnector),
    [currentConnector],
  )

  const enabled =
    connectionStatus === 'connected' && currentConnector !== undefined

  const { data: accounts } = useQuery({
    enabled,
    queryFn: () => currentConnector.getAccounts(),
    queryKey: accountQueryKey,
  })

  const queryClient = useQueryClient()

  useEffect(
    function listenForAccountChange() {
      if (!currentConnector) {
        return undefined
      }
      return currentConnector.onAccountsChanged(acc =>
        queryClient.setQueryData(accountQueryKey, () => acc),
      )
    },
    [accountQueryKey, currentConnector, queryClient],
  )

  const networksQueryKey = useMemo(
    () => getNetworksQueryKey(currentConnector),
    [currentConnector],
  )

  const { data: chain } = useQuery({
    enabled,
    queryFn: () => currentConnector.getNetwork(),
    queryKey: networksQueryKey,
  })

  useEffect(
    function listenForNetworkChange() {
      if (!currentConnector) {
        return undefined
      }
      return currentConnector.onChainChanged(({ network }) =>
        queryClient.setQueryData(networksQueryKey, () => network),
      )
    },
    [currentConnector, networksQueryKey, queryClient],
  )

  const chainDefinition = bitcoinChains.find(c => c.id === chain)
  const supportedChain = supportedChains.find(c => c.id === chain)

  return {
    address: accounts?.[0],
    addresses: accounts,
    // will be undefined if supported
    chain: supportedChain,
    chainId: chainDefinition?.id,
    connector: currentConnector,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    isDisconnected: connectionStatus === 'disconnected',
    isReconnecting: connectionStatus === 'reconnecting',
    status: connectionStatus,
  }
}
