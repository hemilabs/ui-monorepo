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

type OperationsToEstimate =
  | 'challenge-btc-withdrawal'
  | 'confirm-btc-deposit'
  | 'unstake'
  | 'withdraw-btc'

const GasUnitsEstimations: Record<OperationsToEstimate, bigint> = {
  // TODO review estimations https://github.com/hemilabs/ui-monorepo/issues/826
  'challenge-btc-withdrawal': BigInt(400_000),
  // TODO review estimations https://github.com/hemilabs/ui-monorepo/issues/826
  'confirm-btc-deposit': BigInt(400_000),
  // TODO define proper estimation https://github.com/hemilabs/ui-monorepo/issues/774
  'unstake': BigInt(400_000),
  // TODO review estimations https://github.com/hemilabs/ui-monorepo/issues/826
  'withdraw-btc': BigInt(400_000),
}

type UseEstimateFees = {
  chainId: number
  enabled?: boolean
  overEstimation?: number
  // allow consumer of the hook to send a gasUnits (for example, when using OP SDK to estimate the gas units)
  // of for those scenarios where gas units are estimated offline by us, send the key of the operation to estimate
} & ({ gasUnits: bigint } | { operation: OperationsToEstimate })

export const useEstimateFees = function ({
  chainId,
  enabled = true,
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

  const gasUnits =
    'gasUnits' in props
      ? props?.gasUnits ?? BigInt(0)
      : GasUnitsEstimations[props.operation]

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
