import { useQuery } from '@tanstack/react-query'
import { type Account, type Satoshis } from 'btc-wallet/unisat'
import fetch from 'fetch-plus-plus'

const btcInputsSize = parseInt(process.env.NEXT_PUBLIC_BTC_INPUTS_SIZE)
const btcOutputsSize = parseInt(process.env.NEXT_PUBLIC_BTC_OUTPUTS_SIZE)
// the value sent + OP_RETURN with hemi address
const expectedOutputs = 2

type Fees = {
  fastestFee: number
  halfHourFee: number
  hourFee: number
  economyFee: number
  minimumFee: number
}

type Utxo = {
  status: {
    confirmed: boolean
  }
  txid: string
  value: Satoshis
}

export const useGetFeePrices = function () {
  const { data: feePrices, ...rest } = useQuery({
    queryFn: () =>
      fetch(
        `${process.env.NEXT_PUBLIC_MEMPOOL_API_URL}/v1/fees/recommended`,
      ) as Promise<Fees>,
    queryKey: ['btc-estimate-fees'],
    // refetch every minute
    refetchInterval: 1000 * 60,
  })
  return {
    feePrices,
    ...rest,
  }
}

const useGetUtxos = function (account: Account) {
  const { data: utxos, ...rest } = useQuery({
    enabled: !!account,
    queryFn: () =>
      fetch(
        `${process.env.NEXT_PUBLIC_MEMPOOL_API_URL}/address/${account}/utxo`,
      ) as Promise<Utxo[]>,
    queryKey: ['btc-utxos', account],
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
