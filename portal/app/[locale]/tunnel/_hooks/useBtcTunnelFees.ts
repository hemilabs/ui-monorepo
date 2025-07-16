import { useQuery } from '@tanstack/react-query'
import { useHemiClient } from 'hooks/useHemiClient'
import { getBitcoinDepositFee } from 'utils/hemi'

export const useBtcDepositTunnelFees = function (amount: bigint) {
  const hemiClient = useHemiClient()

  const { data: btcDepositFee, ...rest } = useQuery({
    enabled: amount > BigInt(0),
    queryFn: () => getBitcoinDepositFee({ amount, hemiClient }),
    // queryKeys are serialized, and bigints are not automatically serialized.
    queryKey: ['btc-tunne-deposit-fee', amount.toString(), hemiClient.chain.id],
  })

  return {
    btcDepositFee,
    ...rest,
  }
}
