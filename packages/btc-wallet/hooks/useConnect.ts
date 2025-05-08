import { useMutation, useQueryClient } from '@tanstack/react-query'
import { WalletConnector } from 'btc-wallet/connectors/types'
import { useContext } from 'react'

import { GlobalContext } from '../context/globalContext'

import { getNetworksQueryKey } from './queryKeys'

export const useConnect = function () {
  const { setConnectionStatus, setCurrentConnector } = useContext(GlobalContext)
  const queryClient = useQueryClient()

  const { mutate: connect } = useMutation({
    mutationFn(connector: WalletConnector) {
      setConnectionStatus('connecting')
      return connector.connect()
    },
    mutationKey: ['btc-wallet', 'connect'],
    onError() {
      setConnectionStatus('disconnected')
    },
    async onSuccess(_, connector) {
      // update the network data in the cache before marking as "connected"
      // to avoid being connected to "nothing" until network is loaded
      const network = await connector.getNetwork()
      queryClient.setQueryData(getNetworksQueryKey(connector), () => network)
      setConnectionStatus('connected')
      setCurrentConnector(connector)
    },
  })

  return {
    connect,
  }
}
