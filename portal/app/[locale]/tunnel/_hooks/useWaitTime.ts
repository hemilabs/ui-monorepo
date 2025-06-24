import { useQuery } from '@tanstack/react-query'
import { MessageStatusType, ToEvmWithdrawOperation } from 'types/tunnel'
import {
  getTimeToProveInSeconds,
  getTimeToFinalizeInSeconds,
} from 'utils/wait-times/evmWithdrawals'

export const useEvmWithdrawTimeToProve = ({
  enabledStatus,
  withdrawal,
}: {
  enabledStatus: MessageStatusType
  withdrawal: ToEvmWithdrawOperation
}) =>
  useQuery({
    enabled: !!withdrawal && withdrawal.status === enabledStatus,
    queryFn: () => getTimeToProveInSeconds(withdrawal),
    queryKey: ['time-to-prove-withdraw', withdrawal.transactionHash],
    refetchInterval: 24000, // 24 seconds
  })

export const useEvmWithdrawTimeToFinalize = ({
  enabledStatus,
  withdrawal,
}: {
  enabledStatus: MessageStatusType
  withdrawal: ToEvmWithdrawOperation
}) =>
  useQuery({
    enabled: !!withdrawal && withdrawal.status === enabledStatus,
    queryFn: () => getTimeToFinalizeInSeconds(withdrawal),
    queryKey: ['time-to-finalize-withdraw', withdrawal.transactionHash],
    refetchInterval: 24000, // 24 seconds
  })
