import { useQuery } from '@tanstack/react-query'
import {
  MessageStatus,
  MessageStatusType,
  ToEvmWithdrawOperation,
} from 'types/tunnel'
import {
  getTimeToProveInSeconds,
  getTimeToFinalizeInSeconds,
} from 'utils/wait-times/evmWithdrawals'

const enableStatusesToProve = [
  MessageStatus.STATE_ROOT_NOT_PUBLISHED,
  MessageStatus.READY_TO_PROVE,
] as const

const enableStatusesToFinalize = [
  MessageStatus.IN_CHALLENGE_PERIOD,
  MessageStatus.READY_FOR_RELAY,
] as const

const isStatusToEnable = <const T extends readonly MessageStatusType[]>(
  status: MessageStatusType,
  validStatuses: T,
): status is T[number] => validStatuses.includes(status as T[number])

export const useEvmWithdrawTimeToProve = (withdrawal: ToEvmWithdrawOperation) =>
  useQuery({
    enabled:
      !!withdrawal &&
      isStatusToEnable(withdrawal.status, enableStatusesToProve),
    queryFn: () => getTimeToProveInSeconds(withdrawal),
    queryKey: ['time-to-prove-withdraw', withdrawal.transactionHash],
    refetchInterval: 24000, // 24 seconds
  })

export const useEvmWithdrawTimeToFinalize = (
  withdrawal: ToEvmWithdrawOperation,
) =>
  useQuery({
    enabled:
      !!withdrawal &&
      isStatusToEnable(withdrawal.status, enableStatusesToFinalize),
    queryFn: () => getTimeToFinalizeInSeconds(withdrawal),
    queryKey: ['time-to-finalize-withdraw', withdrawal.transactionHash],
    refetchInterval: 24000, // 24 seconds
  })
