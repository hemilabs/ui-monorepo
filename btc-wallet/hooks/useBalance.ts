import { useQuery } from '@tanstack/react-query'
import { useContext } from 'react'

import { GlobalContext } from '../context/globalContext'

import { useAccount } from './useAccount'

export const useBalance = function () {
  const { address, chainId, isConnected } = useAccount()
  const { currentConnector } = useContext(GlobalContext)

  const { data: balance, ...rest } = useQuery({
    enabled: isConnected && currentConnector !== undefined,
    // use "!" because "enabled" already checks currentConnector is defined
    queryFn: () => currentConnector!.getBalance(),
    queryKey: ['btc-wallet', 'balance', address, chainId, currentConnector?.id],
    // 10 minutes
    refetchInterval: 1000 * 60 * 10,
  })

  return {
    balance,
    ...rest,
  }
}
