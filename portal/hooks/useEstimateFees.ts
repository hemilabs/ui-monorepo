import Big from 'big.js'
import { useAccount, useFeeHistory } from 'wagmi'

import { useIsConnectedToExpectedNetwork } from './useIsConnectedToExpectedNetwork'

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
  enabled?: boolean
  isGasUnitsError?: boolean
  overEstimation?: number
  gasUnits?: bigint
}

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

  const baseFeePerGas =
    feeHistory?.baseFeePerGas?.[defaultBlockCount] ?? BigInt(0)

  const gasUnits = props.gasUnits ?? BigInt(0)

  const maxPriorityFeePerGas = mean(feeHistory?.reward.map(r => r[0]))
  const fees = BigInt(
    Big(gasUnits.toString())
      .times(
        Big(baseFeePerGas.toString()).plus(maxPriorityFeePerGas.toString()),
      )
      .times(overEstimation)
      .toFixed(0),
  )

  return {
    fees,
    isError: isGasUnitsError,
  }
}
