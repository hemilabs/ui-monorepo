import { BtcDepositOperation } from 'types/tunnel'
import { Hash } from 'viem'

type Props = {
  deposit: BtcDepositOperation
  focusedDepositHash?: Hash
}

const getSeconds = (seconds: number) => seconds * 1000

export const BitcoinDepositPriority = {
  HIGH: 1, // Focused deposit
  LOW: 0, // Everything else
} as const

export function analyzeBitcoinDepositPolling({
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
      interval: getSeconds(14),
      priority: BitcoinDepositPriority.HIGH,
    }
  }

  return {
    interval: fallback,
    priority: BitcoinDepositPriority.LOW,
  }
}
