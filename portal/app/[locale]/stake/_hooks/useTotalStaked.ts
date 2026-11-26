import { useQuery } from '@tanstack/react-query'
import Big from 'big.js'
import { useHemi } from 'hooks/useHemi'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { isDataUnavailable } from 'utils/queryStatus'
import { getTotalStaked } from 'utils/subgraph'
import { getTokenByAddress, getTokenPrice } from 'utils/token'
import { formatUnits } from 'viem'

/**
 * This hook returns an object grouping the total staked per token
 */
export const useTotalStaked = function () {
  const hemi = useHemi()
  const {
    data: prices,
    fetchStatus: pricesFetchStatus,
    status: pricesStatus,
  } = useTokenPrices()

  const {
    data: totalPerToken,
    fetchStatus: totalStakedFetchStatus,
    status: totalStakedStatus,
  } = useQuery({
    queryFn: () => getTotalStaked(hemi.id),
    queryKey: ['total-staked', hemi.id],
    // every 2 minutes
    refetchInterval: 2 * 60 * 1000,
  })

  const isDataMissing =
    isDataUnavailable({
      fetchStatus: pricesFetchStatus,
      status: pricesStatus,
    }) ||
    isDataUnavailable({
      fetchStatus: totalStakedFetchStatus,
      status: totalStakedStatus,
    })

  const calculateTotalStake = (
    pricesData: Record<string, string>,
    totals: NonNullable<typeof totalPerToken>,
  ) =>
    totals
      .reduce(function (acc, { id, totalStaked }) {
        const token = getTokenByAddress(id, hemi.id)
        // While low chance, there may be a token that is not in the list, if for example
        // someone staked in the contracts directly. For the time being, skip it.
        // We may need to review this in the future... or not. If we don't give points
        // to tokens that are not "selected" by us, perhaps it is safe to ignore them
        // when estimating the total stake.
        if (!token) {
          return acc
        }
        const price = getTokenPrice(token, pricesData)
        const amount = formatUnits(BigInt(totalStaked), token.decimals)
        return acc.plus(Big(amount).times(price))
      }, Big(0))
      .toFixed()

  const totalStake =
    prices !== undefined && totalPerToken !== undefined
      ? calculateTotalStake(prices, totalPerToken)
      : undefined

  return {
    isError: totalStake === undefined && isDataMissing,
    totalStake,
  }
}
