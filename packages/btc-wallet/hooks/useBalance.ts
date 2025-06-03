import { useQuery } from '@tanstack/react-query'
import { useContext } from 'react'

import { GlobalContext } from '../context/globalContext'

import { useAccount } from './useAccount'

export const useBalance = function ({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const { address, chainId, isConnected } = useAccount()
  const { currentConnector } = useContext(GlobalContext)

  const queryKey = [
    'btc-wallet',
    'balance',
    address,
    chainId,
    currentConnector?.id,
    enabled,
  ]

  const { data: balance, ...rest } = useQuery({
    enabled: enabled && isConnected && currentConnector !== undefined,
    // use "!" because "enabled" already checks currentConnector is defined
    queryFn: () => currentConnector!.getBalance(),
    queryKey,
    // 10 minutes
    refetchInterval: 1000 * 60 * 10,
  })

  return {
    balance,
    queryKey,
    ...rest,
  }
}
