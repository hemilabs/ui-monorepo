import Big from 'big.js'
import { useAccount, useFeeHistory } from 'wagmi'

import { useIsConnectedToExpectedNetwork } from './useIsConnectedToExpectedNetwork'

const defaultBlockCount = 4
const defaultOverEstimation = 1

/**
 * Calculates the average of an array of bigints.
 * Returns the average as a stringified number.
 */
const mean = function (rewards: bigint[] = []) {
  if (rewards.length === 0) {
    return '0'
  }
  return rewards
    .reduce((a, b) => Big(a).plus(b.toString()), Big(0))
    .div(rewards.length)
    .toFixed(0)
}

type UseEstimateFees = {
  chainId: number
  enabled?: boolean
  isGasUnitsError?: boolean
  overEstimation?: number
  gasUnits?: bigint
}

/**
 * Estimates the total fee (in wei) for an EIP-1559 transaction.
 *
 * Uses wagmi's `useFeeHistory` to fetch recent base fees and reward percentiles,
 * then calculates:
 * - maxPriorityFeePerGas based on reward percentiles (default: 30%)
 * - maxFeePerGas = baseFee * 2 + priorityFee
 * - Total fees = gasUnits * maxFeePerGas * overEstimation
 *
 * Fallbacks are applied in case of missing data.
 *
 * @returns An object with `fees` (in wei) and `isError` (from gas estimation)
 */
export const useEstimateFees = function ({
  chainId,
  enabled = true,
  isGasUnitsError = false,
  overEstimation = defaultOverEstimation,
  ...props
}: UseEstimateFees) {
  const { isConnected } = useAccount()
  const isConnectedToExpectedChain = useIsConnectedToExpectedNetwork(chainId)
  const { data: feeHistory } = useFeeHistory({
    blockCount: defaultBlockCount,
    blockTag: 'latest',
    chainId,
    query: {
      enabled: isConnected && isConnectedToExpectedChain && enabled,
      // refetch every minute
      refetchInterval: 60 * 1000,
    },
    rewardPercentiles: [30],
  })

  // Safely extract base fee from the latest block
  const baseFeePerGas = feeHistory?.baseFeePerGas?.at(-1)

  // Use the 30th percentile reward as a proxy for maxPriorityFeePerGas
  const prioritySamples = feeHistory?.reward.map(r => r.at(-1)) ?? []
  const maxPriorityFeePerGas = Big(
    prioritySamples.length > 0 ? mean(prioritySamples) : Big(2e9).toFixed(0), // fallback to 2 gwei
  )

  // Build maxFeePerGas = baseFee * 2 + priorityFee
  const safeBaseFeePerGas = baseFeePerGas ?? BigInt(0)
  const safePriorityFee = maxPriorityFeePerGas ?? Big(0)
  const maxFeePerGas = Big(safeBaseFeePerGas.toString())
    .times(2)
    .plus(safePriorityFee.toString())
    .toFixed(0)

  // Calculate estimated fees = gasUnits * maxFeePerGas * overEstimation
  const gasUnits = props.gasUnits ?? BigInt(0)
  const fees = BigInt(
    Big(gasUnits.toString())
      .times(maxFeePerGas)
      .times(overEstimation)
      .toFixed(0),
  )

  return {
    fees,
    isError: isGasUnitsError,
  }
}
