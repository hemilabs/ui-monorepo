'use client'

import { useQueries } from '@tanstack/react-query'
import Big from 'big.js'
import { getTokenPrice } from 'utils/token'
import { formatUnits } from 'viem'

import { sharesToPeggedOptions } from '../_fetchers/fetchSharesToPegged'

import { useEarnPositions } from './useEarnPositions'
import { useEarnTokenPrices } from './useEarnTokenPrices'

type TotalDepositsData = { totalUsd: string }

const positionUsd = (
  peggedAmount: bigint,
  peggedTokenDecimals: number,
  price: string,
) => Big(formatUnits(peggedAmount, peggedTokenDecimals)).times(price)

// Sums each position's USD: shares → pegged (convertToAssets) → priced via the oracle-merged earn feed.
export const useTotalDeposits = function () {
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

  const peggedAmountQueries = useQueries({
    queries: positions.map(position =>
      sharesToPeggedOptions({
        shareAddress: position.shareAddress,
        shares: position.yourDeposit,
      }),
    ),
  })

  const totalUsd = positions
    .reduce(
      (acc, position, index) =>
        acc.plus(
          positionUsd(
            peggedAmountQueries[index]?.data?.peggedAmount ?? BigInt(0),
            position.peggedToken.decimals,
            prices ? getTokenPrice(position.peggedToken, prices) : '0',
          ),
        ),
      Big(0),
    )
    .toFixed(2)

  const data: TotalDepositsData = { totalUsd }

  const hasPositions = positions.length > 0
  const isPending =
    isPositionsPending ||
    (hasPositions && isPricesPending) ||
    peggedAmountQueries.some(q => q.isPending && q.isFetching)
  const isError =
    isPositionsError ||
    (hasPositions && isPricesError) ||
    (peggedAmountQueries.length > 0 &&
      peggedAmountQueries.every(q => q.isError))

  return { data, isError, isPending }
}
