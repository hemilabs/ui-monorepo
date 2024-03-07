import Big from 'big.js'
import { useEstimateFeesPerGas, useFeeHistory } from 'wagmi'

// Overestimation for L1 gas limit used by OP/SDK
// See https://github.com/ethereum-optimism/optimism/blob/592daa704a56f5b3df21b41ea7cc294ab63b95ff/packages/sdk/src/cross-chain-messenger.ts#L2060
const defaultOverEstimation = 1.5

type UseEstimateFees = {
  chainId: number
  enabled: boolean
  gasUnits: bigint
  overEstimation?: number
}

export const useEstimateFees = function ({
  chainId,
  enabled,
  gasUnits = BigInt(0),
  overEstimation = defaultOverEstimation,
}: UseEstimateFees) {
  const { data: fees } = useEstimateFeesPerGas({
    chainId,
    query: {
      enabled,
    },
  })

  const { data: feeHistory } = useFeeHistory({
    chainId,
    query: {
      enabled,
    },
  })

  const { maxPriorityFeePerGas = BigInt(0) } = fees ?? {}

  const { baseFeePerGas = BigInt(0) } = feeHistory ?? {}

  return BigInt(
    Big(gasUnits.toString())
      .times(
        Big(baseFeePerGas.toString()).plus(maxPriorityFeePerGas.toString()),
      )
      .times(overEstimation)
      .toFixed(0),
  )
}
