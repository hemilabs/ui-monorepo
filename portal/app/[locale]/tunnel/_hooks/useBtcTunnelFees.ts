import { useQuery } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { getBitcoinDepositFee, getBitcoinWithdrawalFee } from 'utils/hemi'

export const useBtcDepositTunnelFees = function (amount: bigint) {
  const hemi = useHemi()
  const hemiClient = useHemiClient()

  const { data: btcDepositFee, ...rest } = useQuery({
    enabled: amount > BigInt(0),
    queryFn: () => getBitcoinDepositFee({ amount, hemiClient }),
    queryKey: [
      'btc-tunnel-deposit-fee',
      // queryKeys are serialized, and bigints are not automatically serialized.
      amount.toString(),
      hemi.id,
    ],
  })

  return {
    btcDepositFee,
    ...rest,
  }
}

export const useBtcWithdrawalTunnelFees = function (amount: bigint) {
  const hemi = useHemi()
  const hemiClient = useHemiClient()

  const { data: btcWithdrawalFee, ...rest } = useQuery({
    enabled: amount > BigInt(0),
    queryFn: () => getBitcoinWithdrawalFee({ amount, hemiClient }),
    queryKey: [
      'btc-tunnel-withdrawal-fee',
      // queryKeys are serialized, and bigints are not automatically serialized.
      amount.toString(),
      hemi.id,
    ],
  })

  return {
    btcWithdrawalFee,
    ...rest,
  }
}
