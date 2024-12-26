import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'btc-wallet/hooks/useAccount'
import { type BtcTransaction } from 'btc-wallet/unisat'
import { isChainIdSupported } from 'btc-wallet/utils/chains'
import { createBtcApi } from 'utils/btcApi'

import { useNetworkType } from './useNetworkType'

type Args = {
  txId: BtcTransaction
}

export const useWaitForTransactionReceipt = function ({ txId }: Args) {
  const { chainId } = useAccount()
  const [networkType] = useNetworkType()

  const queryKey = ['btc-wallet-wait-tx', chainId, networkType, txId]

  return {
    ...useQuery({
      enabled: !!txId && !!chainId && isChainIdSupported(chainId),
      queryFn: () => createBtcApi(networkType).getTransactionReceipt(txId),
      queryKey,
      refetchInterval(query) {
        // Poll every 30 secs until confirmed
        if (query.state.data?.status.confirmed) {
          return false
        }
        return 1000 * 30
      },
    }),
    queryKey,
  }
}
