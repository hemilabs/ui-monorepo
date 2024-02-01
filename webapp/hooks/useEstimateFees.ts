import Big from 'big.js'
import { useFeeData } from 'wagmi'

type UseEstimateFees = {
  chainId: number
  enabled: boolean
  gasUnits: bigint
  overEstimation: number
}

export const useEstimateFees = function ({
  chainId,
  enabled,
  gasUnits = BigInt(0),
  overEstimation,
}: UseEstimateFees) {
  const { data: fees } = useFeeData({
    chainId,
    enabled,
    watch: true,
  })

  const { lastBaseFeePerGas = BigInt(0), maxPriorityFeePerGas = BigInt(0) } =
    fees ?? {}

  return BigInt(
    Big(gasUnits.toString())
      .times(
        Big(lastBaseFeePerGas.toString()).plus(maxPriorityFeePerGas.toString()),
      )
      .times(overEstimation)
      .toFixed(),
  )
}
