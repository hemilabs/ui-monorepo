import { EvmDepositOperation } from 'types/tunnel'
import { Hash } from 'viem'

type Props = {
  deposit: EvmDepositOperation
  focusedDepositHash?: Hash
}

const getSeconds = (seconds: number) => seconds * 1000

export const EvmDepositPriority = {
  HIGH: 2, // Focused deposit
  LOW: 0, // Everything else
  MEDIUM: 1, // Missing timestamp or status
} as const

export function analyzeEvmDepositPolling({
  deposit,
  focusedDepositHash,
}: Props) {
  const fallback = getSeconds(28)

  // Focused deposit
  if (
    focusedDepositHash &&
    focusedDepositHash.toLowerCase() === deposit.transactionHash.toLowerCase()
  ) {
    return {
      interval: getSeconds(7),
      priority: EvmDepositPriority.HIGH,
    }
  }

  // Missing timestamp or status
  if (!deposit.timestamp || deposit.status === undefined) {
    return {
      interval: getSeconds(14),
      priority: EvmDepositPriority.MEDIUM,
    }
  }

  return {
    interval: fallback,
    priority: EvmDepositPriority.LOW,
  }
}
