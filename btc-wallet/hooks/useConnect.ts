import { useMutation } from '@tanstack/react-query'
import { WalletConnector } from 'btc-wallet/connectors/types'
import { useContext } from 'react'

import { GlobalContext } from '../context/globalContext'

export const useConnect = function () {
  const { setConnectionStatus, setCurrentConnector } = useContext(GlobalContext)

  const { mutate: connect } = useMutation({
    mutationFn(connector: WalletConnector) {
      setConnectionStatus('connecting')
      return connector.connect()
    },
    mutationKey: ['btc-wallet', 'connect'],
    onError() {
      setConnectionStatus('disconnected')
    },
    onSuccess(_, connector) {
      setConnectionStatus('connected')
      setCurrentConnector(connector)
    },
  })

  return {
    connect,
  }
}
