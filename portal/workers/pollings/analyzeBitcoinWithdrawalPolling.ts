import { BtcWithdrawStatus, type ToBtcWithdrawOperation } from 'types/tunnel'
import { isPendingOperation } from 'utils/tunnel'
import { Hash } from 'viem'

type Props = {
  withdrawal: ToBtcWithdrawOperation
  focusedWithdrawalHash?: Hash
}

const getSeconds = (seconds: number) => seconds * 1000

export const BitcoinWithdrawalPriority = {
  HIGH: 2, // When challenge in progress or initiate withdraw pending
  LOW: 0, // Everything else
  MAX: 3, // Focused withdrawal
  MEDIUM: 1, // Pending operation
} as const

export function analyzeBitcoinWithdrawalPolling({
  focusedWithdrawalHash,
  withdrawal,
}: Props) {
  const fallback = getSeconds(28)

  // Focused withdrawal
  if (
    focusedWithdrawalHash &&
    focusedWithdrawalHash.toLowerCase() ===
      withdrawal.transactionHash.toLowerCase()
  ) {
    return {
      interval: getSeconds(7),
      priority: BitcoinWithdrawalPriority.MAX,
    }
  }

  // When challenge in progress or initiate withdraw pending
  if (
    [
      BtcWithdrawStatus.CHALLENGE_IN_PROGRESS,
      BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING,
    ].includes(withdrawal.status)
  ) {
    return {
      interval: getSeconds(14),
      priority: BitcoinWithdrawalPriority.HIGH,
    }
  }

  // Pending operation (missing status)
  if (isPendingOperation(withdrawal)) {
    return {
      interval: getSeconds(18),
      priority: BitcoinWithdrawalPriority.MEDIUM,
    }
  }

  return {
    interval: fallback,
    priority: BitcoinWithdrawalPriority.LOW,
  }
}
