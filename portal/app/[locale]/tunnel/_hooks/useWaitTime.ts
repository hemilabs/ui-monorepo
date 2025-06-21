import { useQuery } from '@tanstack/react-query'
import { ToEvmWithdrawOperation } from 'types/tunnel'
import {
  getTimeToProveInSeconds,
  getTimeToFinalizeInSeconds,
} from 'utils/wait-times/evmWithdrawals'

export const useEvmWithdrawTimeToProve = (withdrawal: ToEvmWithdrawOperation) =>
  useQuery({
    enabled: !!withdrawal,
    queryFn: () => getTimeToProveInSeconds(withdrawal),
    queryKey: ['time-to-prove-withdraw', withdrawal.transactionHash],
    refetchInterval: 24000, // 24 seconds
  })

export const useEvmWithdrawTimeToFinalize = (
  withdrawal: ToEvmWithdrawOperation,
) =>
  useQuery({
    enabled: !!withdrawal,
    queryFn: () => getTimeToFinalizeInSeconds(withdrawal),
    queryKey: ['time-to-finalize-withdraw', withdrawal.transactionHash],
    refetchInterval: 24000, // 24 seconds
  })
