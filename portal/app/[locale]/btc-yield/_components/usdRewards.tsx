import { useQueries } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import { tokenQueryOptions } from 'hooks/useToken'
import { useTokenPrices } from 'hooks/useTokenPrices'
import Skeleton from 'react-loading-skeleton'
import { TokenWithBalance } from 'types/token'
import { formatFiatNumber } from 'utils/format'
import { type MerklRewards } from 'utils/merkl'
import { calculateUsdValue } from 'utils/prices'
import { useConfig } from 'wagmi'

type Props = {
  merklRewards: MerklRewards
}
export const UsdRewards = function ({ merklRewards }: Props) {
  const config = useConfig()
  const hemi = useHemi()
  const { data: prices, isError: isPricesError } = useTokenPrices()

  const tokenAddresses = merklRewards.map(r => r.token.address)

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

  const tokensWithBalance = queries
    .map(function ({ data: token }) {
      // all scenarios should be found as we checked above there were no errors
      const { amount, claimed } = merklRewards.find(
        mr => mr.token.address === token!.address,
      )!
      return {
        ...token,
        balance: BigInt(amount) - BigInt(claimed),
      } as TokenWithBalance
    })
    .filter(b => b.balance > BigInt(0))

  const usdRewards = calculateUsdValue(tokensWithBalance, prices)

  if (usdRewards === '0') {
    return null
  }

  return <span>{`$ ${formatFiatNumber(usdRewards)}`}</span>
}
