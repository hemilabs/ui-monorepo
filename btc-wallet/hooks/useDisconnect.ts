import { useQueryClient } from '@tanstack/react-query'
import { useContext } from 'react'

import { GlobalContext } from '../context/globalContext'

export const useDisconnect = function () {
  const { setConnectionStatus, setCurrentConnector } = useContext(GlobalContext)

  const queryClient = useQueryClient()

  const disconnect = function () {
    // set as disconnected
    setConnectionStatus('disconnected')
    // remove the connector
    setCurrentConnector(undefined)
    const predicate = query => query.queryKey[0] === 'btc-wallet'
    // now empty all caches from btc-wallet
    queryClient.removeQueries({ predicate })
    // and all mutation states
    queryClient.resetQueries({ predicate })
  }

  return {
    disconnect,
  }
}
