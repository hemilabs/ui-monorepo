import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import { useTokenBalance } from 'hooks/useBalance'
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
import { useAccount, useWalletClient } from 'wagmi'

import { daysToSecondsNumber } from '../_utils/lockCreationTimes'

const ExtraApprovalTimesAmount = 10

type UseStake = {
  extendedErc20Approval?: boolean | undefined
  input: string
  lockupDays: number
  on?: (emitter: EventEmitter<CreateLockEvents>) => void
  token: StakingDashboardToken
  updateStakingDashboardOperation: (payload?: StakingDashboardOperation) => void
}

export const useStake = function ({
  extendedErc20Approval,
  input,
  lockupDays,
  on,
  token,
  updateStakingDashboardOperation,
}: UseStake) {
  const amount = parseTokenUnits(input, token)

  const { address } = useAccount()
  const bridgeAddress = getVeHemiContractAddress(token.chainId)
  const queryClient = useQueryClient()
  const { queryKey: erc20BalanceQueryKey } = useTokenBalance(
    token.chainId,
    token.address,
  )

  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    token.chainId,
  )

  const { data: l2WalletClient } = useWalletClient({
    chainId: token.chainId,
  })

  const { allowanceQueryKey } = useNeedsApproval({
    address: token.address,
    amount,
    spender: bridgeAddress,
  })

  return useMutation({
    mutationFn: function runCreateLock() {
      const { emitter, promise } = createLock({
        account: address,
        amount,
        approvalAmount: extendedErc20Approval
          ? amount * BigInt(ExtraApprovalTimesAmount)
          : amount,
        lockDurationInSeconds: daysToSecondsNumber(lockupDays),
        walletClient: l2WalletClient,
      })

      let stakingOperation: StakingDashboardOperation | undefined

      const getStake = () => ({
        amount: amount.toString(),
        chainId: token.chainId,
        token: token.address,
      })

      function commitUpdate(extra: Partial<StakingDashboardOperation>) {
        const base = stakingOperation ?? {
          chainId: token.chainId,
          lockupDays,
          ...getStake(),
        }

        stakingOperation = { ...base, ...extra }
        updateStakingDashboardOperation(stakingOperation)
      }

      emitter.on('user-signed-approve', function (approvalTxHash) {
        commitUpdate({
          approvalTxHash,
          status: StakingDashboardStatus.APPROVAL_TX_PENDING,
        })
      })
      emitter.on('approve-transaction-reverted', function (receipt) {
        commitUpdate({ status: StakingDashboardStatus.APPROVAL_TX_FAILED })
        updateNativeBalanceAfterFees(receipt)
      })
      emitter.on('approve-transaction-succeeded', function (receipt) {
        commitUpdate({ status: StakingDashboardStatus.APPROVAL_TX_COMPLETED })

        updateNativeBalanceAfterFees(receipt)
        queryClient.invalidateQueries({ queryKey: allowanceQueryKey })
      })
      emitter.on('user-signed-lock-creation', function (transactionHash) {
        commitUpdate({
          status: StakingDashboardStatus.STAKE_TX_PENDING,
          transactionHash,
        })

        updateStakingDashboardOperation(stakingOperation)
      })
      emitter.on('lock-creation-transaction-succeeded', function (receipt) {
        commitUpdate({ status: StakingDashboardStatus.STAKE_TX_CONFIRMED })

        // fees
        updateNativeBalanceAfterFees(receipt)
        // staked
        queryClient.setQueryData(
          erc20BalanceQueryKey,
          (old: bigint) => old - amount,
        )
      })
      emitter.on('lock-creation-transaction-reverted', function (receipt) {
        commitUpdate({ status: StakingDashboardStatus.STAKE_TX_FAILED })

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
        queryKey: erc20BalanceQueryKey,
      })
      queryClient.invalidateQueries({ queryKey: allowanceQueryKey })
    },
  })
}
