import { useQueries } from '@tanstack/react-query'
import Big from 'big.js'
import { getTokenPrice } from 'utils/token'

import { sharesToPeggedOptions } from '../_fetchers/fetchSharesToPegged'
import { positionEarnedUsd } from '../_utils/earnedAmount'
import { inTransitOnlyPositions } from '../_utils/earnRows'

import { useEarnCostBasis } from './useEarnCostBasis'
import { useEarnPools } from './useEarnPools'
import { useEarnPositions } from './useEarnPositions'
import { useEarnTokenPrices } from './useEarnTokenPrices'
import { useInTransitShares } from './useInTransitShares'

// Total earned = Σ (convertToAssets(shares) − cost basis) per position, priced.
// Cost basis (Vetro-parity, unrealized) comes from the earn-cost-basis endpoint;
// the current value reuses the same shares→pegged→USD path as useTotalDeposits.
export const useEarnedAmount = function () {
  const {
    data: positions = [],
    isError: isPositionsError,
    isPending: isPositionsPending,
  } = useEarnPositions()
  const {
    data: prices,
    isError: isPricesError,
    isPending: isPricesPending,
  } = useEarnTokenPrices({ retryOnMount: false })
  const {
    data: costBasis,
    isError: isCostBasisError,
    isLoading: isCostBasisLoading,
  } = useEarnCostBasis()
  const { data: inTransitByShare, isPending: isInTransitPending } =
    useInTransitShares()
  const { data: pools = [] } = useEarnPools()

  const rows = [
    ...positions,
    ...inTransitOnlyPositions(inTransitByShare, positions, pools),
  ]

  const peggedAmountQueries = useQueries({
    queries: rows.map(position =>
      sharesToPeggedOptions({
        shareAddress: position.shareAddress,
        shares:
          position.yourDeposit +
          (inTransitByShare[position.shareAddress.toLowerCase()] ?? BigInt(0)),
      }),
    ),
  })

  const total = rows.reduce(function (acc, position, index) {
    const currentPegged = peggedAmountQueries[index]?.data?.peggedAmount

    if (costBasis === undefined || currentPegged === undefined) return acc
    return acc.plus(
      positionEarnedUsd({
        costBasisBaseUnits:
          costBasis[position.shareAddress.toLowerCase()] ?? '0',
        currentPegged,
        decimals: position.peggedToken.decimals,
        price: prices ? getTokenPrice(position.peggedToken, prices) : '0',
      }),
    )
  }, Big(0))

  const totalUsd = total.toFixed(2)

  const hasRows = rows.length > 0
  const isPending =
    isPositionsPending ||
    isInTransitPending ||
    (hasRows && (isPricesPending || isCostBasisLoading)) ||
    peggedAmountQueries.some(q => q.isPending && q.isFetching)
  const isError =
    isPositionsError ||
    (hasRows && (isPricesError || isCostBasisError)) ||
    peggedAmountQueries.some(q => q.isError)

  return { data: { totalUsd }, isError, isPending }
}
