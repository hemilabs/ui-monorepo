import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'btc-wallet/hooks/useAccount'
import { type BtcTransaction } from 'btc-wallet/unisat'
import { isChainIdSupported } from 'btc-wallet/utils/chains'
import camelCaseKeys from 'camelcase-keys'
import fetch from 'fetch-plus-plus'

type Args = {
  txId: BtcTransaction
}

// See https://mempool.space/testnet/docs/api/rest#get-transaction
type TransactionReceipt = {
  status: {
    blockHeight?: number
    blockTime?: number
    confirmed: boolean
  }
}

export const useWaitForTransactionReceipt = function ({ txId }: Args) {
  const { chainId } = useAccount()

  const queryKey = ['btc-wallet-wait-tx', chainId, txId]

  return {
    ...useQuery({
      enabled: !!txId && !!chainId && isChainIdSupported(chainId),
      queryFn: () =>
        fetch(`${process.env.NEXT_PUBLIC_MEMPOOL_API_URL}/tx/${txId}`)
          .catch(function (err) {
            if (err?.message.includes('not found')) {
              // It seems it takes a couple of seconds for the Tx for being picked up
              // react-query doesn't let us to return undefined data, so we must
              // return an unconfirmed status
              // Once it appears in the mempool, it will return the full object
              // with the same confirmation status as false.
              return { status: { confirmed: false } }
            }
            throw err
          })
          .then(camelCaseKeys) as Promise<TransactionReceipt | undefined>,
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
