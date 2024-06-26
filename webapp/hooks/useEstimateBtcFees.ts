import { useQuery } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'

type Fees = Record<number, number>

type Options = {
  feeBlocks: number
  txSize: number
}

export const useEstimateBtcFees = function ({ feeBlocks, txSize }: Options) {
  const { data: estimations, ...rest } = useQuery({
    queryFn: () =>
      fetch(
        `${process.env.NEXT_PUBLIC_BLOCKSTREAM_API_URL}/fee-estimates`,
      ) as Promise<Fees>,
    queryKey: ['btc-estimate-fees'],
    // refetch every minute
    refetchInterval: 1000 * 60,
  })

  return {
    fees: rest.isLoading
      ? undefined
      : Math.ceil(estimations[feeBlocks] * txSize),
    ...rest,
  }
}
