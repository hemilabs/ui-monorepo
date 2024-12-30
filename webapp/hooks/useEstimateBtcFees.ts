import { useQuery } from '@tanstack/react-query'
import { type Account } from 'btc-wallet/unisat'
import { createBtcApi } from 'utils/btcApi'

import { useNetworkType } from './useNetworkType'

const btcInputsSize = parseInt(process.env.NEXT_PUBLIC_BTC_INPUTS_SIZE)
const btcOutputsSize = parseInt(process.env.NEXT_PUBLIC_BTC_OUTPUTS_SIZE)
// the value sent + OP_RETURN with hemi address
const expectedOutputs = 2

export const useGetFeePrices = function () {
  const [networkType] = useNetworkType()
  const { data: feePrices, ...rest } = useQuery({
    queryFn: () => createBtcApi(networkType).getRecommendedFees(),
    queryKey: ['btc-recommended-fees', networkType],
    // refetch every minute
    refetchInterval: 1000 * 60,
  })
  return {
    feePrices,
    ...rest,
  }
}

const useGetUtxos = function (account: Account) {
  const [networkType] = useNetworkType()
  const { data: utxos, ...rest } = useQuery({
    enabled: !!account,
    queryFn: () => createBtcApi(networkType).getAddressTxsUtxo(account),
    queryKey: ['btc-utxos', account, networkType],
  })
  return {
    utxos,
    ...rest,
  }
}

const calculateTxSize = utxos =>
  expectedOutputs * btcOutputsSize + utxos.length * btcInputsSize

export const useEstimateBtcFees = function (from: Account) {
  const { feePrices, isLoading: isLoadingFeePrices } = useGetFeePrices()
  const { utxos, isLoading: isLoadingUtxos } = useGetUtxos(from)

  const isLoading = isLoadingFeePrices || isLoadingUtxos

  return {
    fees:
      isLoading || utxos === undefined
        ? undefined
        : Math.ceil(feePrices.fastestFee * calculateTxSize(utxos)),
    isLoading,
  }
}
