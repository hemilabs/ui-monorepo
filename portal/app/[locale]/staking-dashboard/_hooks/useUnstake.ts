import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useUpdateNativeBalanceAfterReceipt } from 'hooks/useInvalidateNativeBalanceAfterReceipt'
import { useUmami } from 'hooks/useUmami'
import {
  StakingDashboardToken,
  StakingPosition,
  StakingPositionStatus,
  UnstakingDashboardOperation,
  UnstakingDashboardStatus,
} from 'types/stakingDashboard'
import { WithdrawEvents } from 've-hemi-actions'
import { withdraw } from 've-hemi-actions/actions'
import { useAccount } from 'wagmi'

import { useDrawerStakingQueryString } from './useDrawerStakingQueryString'
import { getStakingPositionsQueryKey } from './useStakingPositions'

type UseUnstake = {
  amount: bigint
  on?: (emitter: EventEmitter<WithdrawEvents>) => void
  token: StakingDashboardToken
  tokenId: string
  updateUnstakingDashboardOperation: (
    payload?: UnstakingDashboardOperation,
  ) => void
}

export const useUnstake = function ({
  amount,
  on,
  token,
  tokenId,
  updateUnstakingDashboardOperation,
}: UseUnstake) {
  const { setDrawerQueryString } = useDrawerStakingQueryString()
  const { track } = useUmami()
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const { queryKey: hemiBalanceQueryKey } = useTokenBalance(
    token.chainId,
    token.address,
  )

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

  return useMutation({
    mutationFn: function runWithdraw() {
      if (!address) {
        throw new Error('No account connected')
      }
      const { emitter, promise } = withdraw({
        account: address,
        tokenId: BigInt(tokenId),
        walletClient: hemiWalletClient!,
      })

      emitter.on('user-signed-withdraw', function (transactionHash) {
        updateUnstakingDashboardOperation({
          stakingPosition: { amount, tokenId },
          status: UnstakingDashboardStatus.UNSTAKE_TX_PENDING,
          transactionHash,
        })
        setDrawerQueryString('unstaking')

        track?.('staking dashboard - signed withdraw')
      })
      emitter.on('user-signing-withdraw-error', function () {
        updateUnstakingDashboardOperation({
          status: UnstakingDashboardStatus.UNSTAKE_TX_FAILED,
        })

        track?.('staking dashboard - signing withdraw error')
      })
      emitter.on('withdraw-transaction-succeeded', function (receipt) {
        updateUnstakingDashboardOperation({
          status: UnstakingDashboardStatus.UNSTAKE_TX_CONFIRMED,
        })

        queryClient.setQueryData(
          stakingPositionQueryKey,
          (old: StakingPosition[] | undefined = []) =>
            old.map(position =>
              position.tokenId === tokenId.toString()
                ? { ...position, status: StakingPositionStatus.WITHDRAWN }
                : position,
            ),
        )

        // fees
        updateNativeBalanceAfterFees(receipt)
        // staked
        queryClient.setQueryData(
          hemiBalanceQueryKey,
          (old: bigint) => old + amount,
        )

        track?.('staking dashboard - withdraw success')
      })
      emitter.on('withdraw-transaction-reverted', function (receipt) {
        updateUnstakingDashboardOperation({
          status: UnstakingDashboardStatus.UNSTAKE_TX_FAILED,
        })

        // Although the transaction was reverted, the gas was paid.
        updateNativeBalanceAfterFees(receipt)

        track?.('staking dashboard - withdraw transaction reverted')
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
