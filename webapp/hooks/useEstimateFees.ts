import Big from 'big.js'
import { useFeeHistory } from 'wagmi'

const defaultBlockCount = 4
const defaultOverEstimation = 1

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
  const { data: feeHistory } = useFeeHistory({
    blockCount: defaultBlockCount,
    blockTag: 'latest',
    chainId,
    query: {
      enabled,
      // refetch every 15 seconds
      refetchInterval: 15 * 1000,
    },
    rewardPercentiles: [30],
  })

  const baseFeePerGas =
    feeHistory?.baseFeePerGas?.[defaultBlockCount] ?? BigInt(0)
  const maxPriorityFeePerGas = mean(feeHistory?.reward.map(r => r[0]))
  return BigInt(
    Big(gasUnits.toString())
      .times(
        Big(baseFeePerGas.toString()).plus(maxPriorityFeePerGas.toString()),
      )
      .times(overEstimation)
      .toFixed(0),
  )
}
