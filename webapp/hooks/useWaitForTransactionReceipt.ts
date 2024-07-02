import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'btc-wallet/hooks/useAccount'
import { type BtcTransaction } from 'btc-wallet/unisat'
import { isChainIdSupported } from 'btc-wallet/utils/chains'
import fetch from 'fetch-plus-plus'

type Args = {
  txId: BtcTransaction
}

// See https://github.com/Blockstream/esplora/blob/master/API.md#transaction-format
type TransactionReceipt = {
  status: {
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
        fetch(
          `${process.env.NEXT_PUBLIC_BLOCKSTREAM_API_URL}/tx/${txId}`,
        ).catch(function (err) {
          if (err?.message.includes('not found')) {
            // this means that the Tx hasn't been mined yet.
            // We will have to wait a bit, so do nothing in this case
            // react-query doesn't let us to return undefined data, so we must
            // return an unconfirmed status
            return { status: { confirmed: false } }
          }
          throw err
        }) as Promise<TransactionReceipt | undefined>,
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
