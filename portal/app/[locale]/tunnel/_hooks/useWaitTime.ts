import { useQuery } from '@tanstack/react-query'
import { MessageStatusType, ToEvmWithdrawOperation } from 'types/tunnel'
import {
  getTimeToProveInSeconds,
  getTimeToFinalizeInSeconds,
} from 'utils/wait-times/evmWithdrawals'

export const isStatusToEnable = <const T extends readonly MessageStatusType[]>(
  status: MessageStatusType,
  validStatuses: T,
): status is T[number] => validStatuses.includes(status as T[number])

export const useEvmWithdrawTimeToProve = ({
  validStatuses,
  withdrawal,
}: {
  validStatuses: readonly MessageStatusType[]
  withdrawal: ToEvmWithdrawOperation
}) =>
  useQuery({
    enabled: !!withdrawal && isStatusToEnable(withdrawal.status, validStatuses),
    queryFn: () => getTimeToProveInSeconds(withdrawal),
    queryKey: ['time-to-prove-withdraw', withdrawal.transactionHash],
    refetchInterval: 24000, // 24 seconds
  })

export const useEvmWithdrawTimeToFinalize = ({
  validStatuses,
  withdrawal,
}: {
  validStatuses: readonly MessageStatusType[]
  withdrawal: ToEvmWithdrawOperation
}) =>
  useQuery({
    enabled: !!withdrawal && isStatusToEnable(withdrawal.status, validStatuses),
    queryFn: () => getTimeToFinalizeInSeconds(withdrawal),
    queryKey: ['time-to-finalize-withdraw', withdrawal.transactionHash],
    refetchInterval: 24000, // 24 seconds
  })
