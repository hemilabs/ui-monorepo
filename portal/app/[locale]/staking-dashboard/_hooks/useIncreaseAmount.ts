import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useUpdateNativeBalanceAfterReceipt } from 'hooks/useInvalidateNativeBalanceAfterReceipt'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import { useUmami } from 'hooks/useUmami'
import {
  type StakingDashboardOperation,
  StakingDashboardStatus,
  type StakingDashboardToken,
  type StakingPosition,
} from 'types/stakingDashboard'
import { parseTokenUnits } from 'utils/token'
import { getVeHemiContractAddress, IncreaseAmountEvents } from 've-hemi-actions'
import { increaseAmount } from 've-hemi-actions/actions'
import { useAccount } from 'wagmi'

import { getStakingPositionsQueryKey } from './useStakingPositions'

type UseIncreaseAmount = {
  input: string
  on?: (emitter: EventEmitter<IncreaseAmountEvents>) => void
  token: StakingDashboardToken
  tokenId: string
  updateStakingDashboardOperation: (payload?: StakingDashboardOperation) => void
}

export const useIncreaseAmount = function ({
  input,
  on,
  token,
  tokenId,
  updateStakingDashboardOperation,
}: UseIncreaseAmount) {
  const { track } = useUmami()
  const { address } = useAccount()
  const veHemiAddress = getVeHemiContractAddress(token.chainId)
  const queryClient = useQueryClient()
  const { queryKey: hemiBalanceQueryKey } = useTokenBalance(
    token.chainId,
    token.address,
  )

  const amount = parseTokenUnits(input, token)

  const stakingPositionQueryKey = getStakingPositionsQueryKey({
    address,
    chainId: token.chainId,
  })

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
    mutationFn: function runIncreaseAmount() {
      if (!address) {
        throw new Error('No account connected')
      }
      const { emitter, promise } = increaseAmount({
        account: address,
        additionalAmount: amount,
        approvalAdditionalAmount: amount,
        tokenId: BigInt(tokenId),
        walletClient: hemiWalletClient!,
      })

      emitter.on('user-signed-approve', function (approvalTxHash) {
        updateStakingDashboardOperation({
          approvalTxHash,
          status: StakingDashboardStatus.APPROVAL_TX_PENDING,
          transactionHash: undefined,
        })
      })
      emitter.on('approve-transaction-reverted', function (receipt) {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.APPROVAL_TX_FAILED,
        })

        updateNativeBalanceAfterFees(receipt)

        track?.('staking dashboard - approve increase amount reverted')
      })
      emitter.on('approve-transaction-succeeded', function (receipt) {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.APPROVAL_TX_COMPLETED,
        })

        updateNativeBalanceAfterFees(receipt)
        queryClient.invalidateQueries({ queryKey: allowanceQueryKey })
      })
      emitter.on('user-signed-increase-amount', function (transactionHash) {
        updateStakingDashboardOperation({
          stakingPosition: { amount, tokenId },
          status: StakingDashboardStatus.STAKE_TX_PENDING,
          transactionHash,
        })

        track?.('staking dashboard - signed increase amount')
      })
      emitter.on('user-signing-increase-amount-error', function () {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.STAKE_TX_FAILED,
        })

        track?.('staking dashboard - signing increase amount error')
      })
      emitter.on('increase-amount-transaction-succeeded', function (receipt) {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.STAKE_TX_CONFIRMED,
        })

        queryClient.setQueryData(
          stakingPositionQueryKey,
          (old: StakingPosition[] | undefined = []) =>
            old.map(position =>
              position.tokenId === tokenId
                ? { ...position, amount: position.amount + amount }
                : position,
            ),
        )

        // fees
        updateNativeBalanceAfterFees(receipt)
        // HEMI balance
        queryClient.setQueryData(
          hemiBalanceQueryKey,
          (old: bigint) => old + amount,
        )

        track?.('staking dashboard - increase amount success')
      })
      emitter.on('increase-amount-transaction-reverted', function (receipt) {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.STAKE_TX_FAILED,
        })

        // Although the transaction was reverted, the gas was paid.
        updateNativeBalanceAfterFees(receipt)

        track?.('staking dashboard - increase amount transaction reverted')
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

      queryClient.invalidateQueries({
        queryKey: nativeTokenBalanceQueryKey,
      })
    },
  })
}
