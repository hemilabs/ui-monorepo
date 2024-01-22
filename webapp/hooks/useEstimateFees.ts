import Big from 'big.js'
import { useFeeData } from 'wagmi'

export const useEstimateFees = function (chainId: number, expectedGas: number) {
  const { data: fees } = useFeeData({
    chainId,
    watch: true,
  })

  const { lastBaseFeePerGas = BigInt(0), maxPriorityFeePerGas = BigInt(0) } =
    fees ?? {}

  return BigInt(
    Big(expectedGas)
      .times(
        Big(lastBaseFeePerGas.toString()).plus(maxPriorityFeePerGas.toString()),
      )
      .toFixed(),
  )
}
