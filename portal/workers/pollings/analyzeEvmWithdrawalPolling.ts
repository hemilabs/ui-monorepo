import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { MessageStatus, type ToEvmWithdrawOperation } from 'types/tunnel'
import { Hash } from 'viem'

type Props = {
  withdrawal: ToEvmWithdrawOperation
  focusedWithdrawalHash?: Hash
}

const getSeconds = (seconds: number) => seconds * 1000
const getMinutes = (minutes: number) => getSeconds(minutes * 60)

// use different refetch intervals depending on the status and chain
const refetchInterval = {
  [hemiMainnet.id]: {
    [MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE]: getSeconds(24),
    [MessageStatus.FAILED_L1_TO_L2_MESSAGE]: getMinutes(3),
    [MessageStatus.STATE_ROOT_NOT_PUBLISHED]: getMinutes(1),
    [MessageStatus.READY_TO_PROVE]: getMinutes(1),
    [MessageStatus.IN_CHALLENGE_PERIOD]: getMinutes(3),
    [MessageStatus.READY_FOR_RELAY]: getMinutes(3),
    [MessageStatus.RELAYED]: getMinutes(3),
  },
  [hemiTestnet.id]: {
    [MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE]: getSeconds(24),
    [MessageStatus.FAILED_L1_TO_L2_MESSAGE]: getMinutes(3),
    [MessageStatus.STATE_ROOT_NOT_PUBLISHED]: getMinutes(1),
    [MessageStatus.READY_TO_PROVE]: getMinutes(2),
    [MessageStatus.IN_CHALLENGE_PERIOD]: getMinutes(2),
    [MessageStatus.READY_FOR_RELAY]: getMinutes(2),
    [MessageStatus.RELAYED]: getMinutes(3),
  },
} satisfies { [chainId: number]: { [status: number]: number | false } }

export const EvmWithdrawalPriority = {
  HIGH: 2, // Focused withdrawal
  LOW: 0, // Everything else
  MEDIUM: 1, // Missing status or timestamp
} as const

// See https://www.npmjs.com/package/p-queue#priority
export function analyzeEvmWithdrawalPolling({
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
      priority: EvmWithdrawalPriority.HIGH,
    }
  }

  // Missing status or timestamp
  if (!withdrawal.timestamp || withdrawal.status === undefined) {
    return {
      interval: getSeconds(14),
      priority: EvmWithdrawalPriority.MEDIUM,
    }
  }

  return {
    interval:
      refetchInterval[withdrawal.l2ChainId]?.[withdrawal.status] ?? fallback,
    priority: EvmWithdrawalPriority.LOW,
  }
}
