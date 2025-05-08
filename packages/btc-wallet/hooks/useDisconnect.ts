import { type Query, useMutation, useQueryClient } from '@tanstack/react-query'
import { useContext } from 'react'

import { GlobalContext } from '../context/globalContext'

export const useDisconnect = function () {
  const { currentConnector, setConnectionStatus, setCurrentConnector } =
    useContext(GlobalContext)

  const queryClient = useQueryClient()

  const { mutate: disconnect } = useMutation({
    mutationFn() {
      if (!currentConnector) {
        throw new Error('No connector to disconnect')
      }
      // before disconnecting, clear the connection status
      // otherwise, queries may run before the status is updated
      // prompting again to connect
      setConnectionStatus('disconnected')
      setCurrentConnector(undefined)
      // now, disconnect
      return currentConnector.disconnect()
    },
    mutationKey: ['btc-wallet', 'disconnect'],
    onSuccess() {
      const predicate = (query: Query) => query.queryKey[0] === 'btc-wallet'
      // now empty all caches from btc-wallet
      queryClient.removeQueries({ predicate })
      // and all mutation states
      queryClient.resetQueries({ predicate })
    },
  })

  return {
    disconnect,
  }
}
