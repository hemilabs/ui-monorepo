import { useQueries } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { tokenQueryOptions } from 'hooks/useToken'
import { useTokenPrices } from 'hooks/useTokenPrices'
import Skeleton from 'react-loading-skeleton'
import { TokenWithBalance } from 'types/token'
import { formatFiatNumber } from 'utils/format'
import { calculateUsdValue } from 'utils/prices'
import { Address } from 'viem'
import { useConfig } from 'wagmi'

type Props = {
  amounts: bigint[]
  tokenAddresses: Address[]
}
export const UsdRewards = function ({ amounts, tokenAddresses }: Props) {
  const config = useConfig()
  const hemi = useHemi()
  const { data: prices, isError: isPricesError } = useTokenPrices()

  const queries = useQueries({
    queries: tokenAddresses.map(address =>
      tokenQueryOptions({
        address,
        chainId: hemi.id,
        config,
      }),
    ),
  })

  if (queries.some(query => query.isError) || isPricesError) {
    // if any token fails to load, or the prices fail, we can't show the USD
    return null
  }
  if (queries.some(query => query.data === undefined) || prices === undefined) {
    // things are still loading
    return <Skeleton />
  }

  const tokensWithBalance = queries.map(function ({ data: token }, index) {
    const amount = amounts[index]
    return {
      ...token,
      balance: amount,
    } as TokenWithBalance
  })

  const usdRewards = calculateUsdValue(tokensWithBalance, prices)

  if (usdRewards === '0') {
    return null
  }

  return <span>{`$ ${formatFiatNumber(usdRewards)}`}</span>
}
