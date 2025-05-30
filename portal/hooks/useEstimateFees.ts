import Big from 'big.js'
import { hemiSepolia } from 'hemi-viem'
import {
  useAccount,
  useEstimateMaxPriorityFeePerGas,
  useFeeHistory,
} from 'wagmi'

import { useIsConnectedToExpectedNetwork } from './useIsConnectedToExpectedNetwork'

const defaultBlockCount = 4
const defaultOverEstimation = 1
const defaultFeeMultiplier = 2

// Fallback priority fee values (in wei) used when the estimation API returns 0 or unrealistic values.
// - `default`: 1 Gwei (suitable for mainnet and most testnets)
// - `low`: 0.0001 Gwei (used for testnets with very low gas requirements)
const fallbackPriorityFeeOptions = {
  default: Big(1e9),
  low: Big(1e5),
}

// Fallback priority fee:
// - Use 1 Gwei for most networks.
// - Use a lower fallback (0.0001 Gwei) for Hemi Sepolia due to low gas usage.
const fallbackPriorityFeeByChain: Record<number, Big> = {
  [hemiSepolia.id]: fallbackPriorityFeeOptions.low,
}

type UseEstimateFees = {
  chainId: number
  enabled?: boolean
  isGasUnitsError?: boolean
  overEstimation?: number
  gasUnits?: bigint
}

/**
 * Custom hook to estimate the total transaction fee for an EIP-1559 compatible network.
 *
 * It uses recent base fee history and a suggested or fallback maxPriorityFeePerGas to
 * calculate a conservative `maxFeePerGas`, and multiplies it by the estimated gas units.
 * This hook supports a custom `overEstimation` factor to pad the result for safety.
 *
 * @param {Object} params - Hook parameters.
 * @param {number} params.chainId - The chain ID of the target network.
 * @param {boolean} [params.enabled=true] - Whether the hook is enabled.
 * @param {boolean} [params.isGasUnitsError=false] - Whether there was an error in estimating gas units.
 * @param {number} [params.overEstimation=1] - Optional multiplier to pad the estimated fee for safety.
 * @param {bigint} [params.gasUnits] - Estimated gas units for the transaction.
 *
 * @returns {Object} Result object.
 * @returns {bigint} result.fees - Estimated total fee in wei.
 * @returns {boolean} result.isError - Indicates whether there was a gas estimation error.
 */
export function useEstimateFees({
  chainId,
  enabled = true,
  isGasUnitsError = false,
  overEstimation = defaultOverEstimation,
  ...props
}: UseEstimateFees) {
  const { isConnected } = useAccount()
  const isConnectedToExpectedChain = useIsConnectedToExpectedNetwork(chainId)

  const { data: feeHistory, isError: isFeeHistoryError } = useFeeHistory({
    blockCount: defaultBlockCount,
    blockTag: 'latest',
    chainId,
    query: {
      enabled: isConnected && isConnectedToExpectedChain && enabled,
      refetchInterval: 60 * 1000,
    },
    rewardPercentiles: [30],
  })

  // Use the base fee from the latest block in the fee history.
  // This value is in wei and reflects the current network congestion.
  const baseFeePerGas = feeHistory?.baseFeePerGas?.at(-1) ?? BigInt(0)

  const { data: maxPriorityFeePerGas, isError: isMaxPriorityFeePerGasError } =
    useEstimateMaxPriorityFeePerGas({
      chainId,
    })

  // Convert the suggested priority fee (in wei) to a Big number.
  // If not available, fallback to zero for now and correct below.
  const rawPriorityFeeWei = Big(maxPriorityFeePerGas?.toString() ?? '0')

  // Determine the fallback priority fee for the given chain.
  // If the current chain has a custom fallback (e.g., Hemi Sepolia with very low gas costs), use it.
  // Otherwise, default to 1 Gwei, which is appropriate for most networks.
  const fallbackPriorityFee =
    fallbackPriorityFeeByChain[chainId] ?? fallbackPriorityFeeOptions.default

  // Use the estimated priority fee if it's above the fallback,
  // otherwise use the fallback to avoid underestimating the fee.
  const safePriorityFeeWei = rawPriorityFeeWei.gt(fallbackPriorityFee)
    ? rawPriorityFeeWei
    : fallbackPriorityFee

  // Calculate the maxFeePerGas using EIP-1559 strategy:
  // maxFeePerGas = baseFee * multiplier + priorityFee
  const maxFeePerGasWei = Big(baseFeePerGas.toString())
    .times(defaultFeeMultiplier)
    .plus(safePriorityFeeWei)

  const gasUnits = props.gasUnits ?? BigInt(0)

  // Estimate the total fee by multiplying gas units by the max fee per gas,
  // and applying an overestimation multiplier (typically 1.0 or 1.5 for safety).
  const totalFeeEstimate = Big(gasUnits.toString())
    .times(maxFeePerGasWei)
    .times(overEstimation)

  return {
    fees: BigInt(totalFeeEstimate.toFixed(0)),
    isError:
      isGasUnitsError || isFeeHistoryError || isMaxPriorityFeePerGasError,
  }
}
