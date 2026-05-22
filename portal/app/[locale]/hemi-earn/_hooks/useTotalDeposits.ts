'use client'

import { useQueries } from '@tanstack/react-query'
import Big from 'big.js'
import { getStakingVaultForShare } from 'hemi-earn-actions'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { getTokenPrice } from 'utils/token'
import { formatUnits } from 'viem'
import { convertToAssets } from 'viem-erc4626/actions'

import { useEarnPositions } from './useEarnPositions'

type TotalDepositsData = { totalUsd: string }

const positionUsd = (
  peggedAmount: bigint,
  peggedTokenDecimals: number,
  price: string,
) => Big(formatUnits(peggedAmount, peggedTokenDecimals)).times(price)

// Sums the USD value of every share position the user holds. Each entry is
// `convertToAssets(stakingVault, shares)` (shares → pegged token) priced via
// `getTokenPrice(peggedToken)` against the portal price feed.
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
  } = useTokenPrices({ retryOnMount: false })

  const peggedAmountQueries = useQueries({
    queries: positions.map(position => ({
      enabled: position.yourDeposit > BigInt(0),
      queryFn: () =>
        convertToAssets(getEvmL1PublicClient(mainnet.id), {
          address: getStakingVaultForShare(position.shareAddress),
          shares: position.yourDeposit,
        }),
      queryKey: [
        'hemi-earn',
        'total-deposits',
        position.shareAddress,
        position.yourDeposit.toString(),
      ],
    })),
  })

  const totalUsd = positions
    .reduce(
      (acc, position, index) =>
        acc.plus(
          positionUsd(
            peggedAmountQueries[index]?.data ?? BigInt(0),
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
