import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useUpdateNativeBalanceAfterReceipt } from 'hooks/useInvalidateNativeBalanceAfterReceipt'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import {
  StakingDashboardOperation,
  StakingDashboardStatus,
  StakingDashboardToken,
} from 'types/stakingDashboard'
import { parseTokenUnits } from 'utils/token'
import { CreateLockEvents, getVeHemiContractAddress } from 've-hemi-actions'
import { createLock } from 've-hemi-actions/actions'
import { useAccount } from 'wagmi'

import { daysToSeconds } from '../_utils/lockCreationTimes'

import { useDrawerStakingQueryString } from './useDrawerStakingQueryString'

type UseStake = {
  input: string
  lockupDays: number
  on?: (emitter: EventEmitter<CreateLockEvents>) => void
  token: StakingDashboardToken
  updateStakingDashboardOperation: (payload?: StakingDashboardOperation) => void
}

export const useStake = function ({
  input,
  lockupDays,
  on,
  token,
  updateStakingDashboardOperation,
}: UseStake) {
  const amount = parseTokenUnits(input, token)

  const { setDrawerQueryString } = useDrawerStakingQueryString()
  const { address } = useAccount()
  const veHemiAddress = getVeHemiContractAddress(token.chainId)
  const queryClient = useQueryClient()
  const { queryKey: hemiBalanceQueryKey } = useTokenBalance(
    token.chainId,
    token.address,
  )

  const { queryKey: nativeTokenBalanceQueryKey } = useNativeTokenBalance(
    token.chainId,
  )

  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    token.chainId,
  )

  const { hemiWalletClient } = useHemiWalletClient()

  const { allowanceQueryKey } = useNeedsApproval({
    address: token.address,
    amount,
    spender: veHemiAddress,
  })

  return useMutation({
    mutationFn: function runCreateLock() {
      const { emitter, promise } = createLock({
        account: address,
        amount,
        approvalAmount: amount,
        lockDurationInSeconds: daysToSeconds(lockupDays),
        walletClient: hemiWalletClient,
      })

      emitter.on('user-signed-approve', function (approvalTxHash) {
        updateStakingDashboardOperation({
          approvalTxHash,
          status: StakingDashboardStatus.APPROVAL_TX_PENDING,
          transactionHash: undefined,
        })
        setDrawerQueryString('staking')
      })
      emitter.on('approve-transaction-reverted', function (receipt) {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.APPROVAL_TX_FAILED,
        })

        updateNativeBalanceAfterFees(receipt)
      })
      emitter.on('approve-transaction-succeeded', function (receipt) {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.APPROVAL_TX_COMPLETED,
        })

        updateNativeBalanceAfterFees(receipt)
        queryClient.invalidateQueries({ queryKey: allowanceQueryKey })
      })
      emitter.on('user-signed-lock-creation', function (transactionHash) {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.STAKE_TX_PENDING,
          transactionHash,
        })
        setDrawerQueryString('staking')
      })
      emitter.on('user-signing-lock-creation-error', function () {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.STAKE_TX_FAILED,
        })
      })
      emitter.on('lock-creation-transaction-succeeded', function (receipt) {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.STAKE_TX_CONFIRMED,
        })

        // fees
        updateNativeBalanceAfterFees(receipt)
        // staked
        queryClient.setQueryData(
          hemiBalanceQueryKey,
          (old: bigint) => old - amount,
        )
      })
      emitter.on('lock-creation-transaction-reverted', function (receipt) {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.STAKE_TX_FAILED,
        })

        // Although the transaction was reverted, the gas was paid.
        updateNativeBalanceAfterFees(receipt)
      })

      on?.(emitter)

      return promise
    },
    onSettled() {
      // Do not return the promises here. Doing so will delay the resolution of
      // the mutation, which will cause the UI to be out of sync until balances are re-validated.
      // Query invalidation here must work as fire and forget, as, after all, it runs in the background!
      queryClient.invalidateQueries({
        queryKey: hemiBalanceQueryKey,
      })

      queryClient.invalidateQueries({ queryKey: allowanceQueryKey })

      queryClient.invalidateQueries({
        queryKey: nativeTokenBalanceQueryKey,
      })
    },
  })
}
