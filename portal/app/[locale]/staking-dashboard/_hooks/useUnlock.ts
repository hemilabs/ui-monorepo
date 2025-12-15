import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useEnsureConnectedTo } from 'hooks/useEnsureConnectedTo'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useUpdateNativeBalanceAfterReceipt } from 'hooks/useInvalidateNativeBalanceAfterReceipt'
import { useUmami } from 'hooks/useUmami'
import {
  StakingDashboardToken,
  StakingPosition,
  StakingPositionStatus,
  UnlockingDashboardOperation,
  UnlockingDashboardStatus,
} from 'types/stakingDashboard'
import { WithdrawEvents } from 've-hemi-actions'
import { withdraw } from 've-hemi-actions/actions'
import { useAccount } from 'wagmi'

import { useDrawerStakingQueryString } from './useDrawerStakingQueryString'
import { getStakingPositionsQueryKey } from './useStakingPositions'

type UseUnlock = {
  amount: bigint
  on?: (emitter: EventEmitter<WithdrawEvents>) => void
  token: StakingDashboardToken
  tokenId: bigint
  updateUnlockingDashboardOperation: (
    payload?: UnlockingDashboardOperation,
  ) => void
}

export const useUnlock = function ({
  amount,
  on,
  token,
  tokenId,
  updateUnlockingDashboardOperation,
}: UseUnlock) {
  const { setDrawerQueryString } = useDrawerStakingQueryString()
  const { track } = useUmami()
  const { address } = useAccount()
  const ensureConnectedTo = useEnsureConnectedTo()
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
    mutationFn: async function runWithdraw() {
      if (!address) {
        throw new Error('No account connected')
      }

      await ensureConnectedTo(token.chainId)

      const { emitter, promise } = withdraw({
        account: address,
        tokenId,
        walletClient: hemiWalletClient!,
      })

      emitter.on('user-signed-withdraw', function (transactionHash) {
        updateUnlockingDashboardOperation({
          stakingPosition: { amount, tokenId },
          status: UnlockingDashboardStatus.UNLOCK_TX_PENDING,
          transactionHash,
        })
        setDrawerQueryString('unlocking')

        track?.('staking dashboard - signed withdraw')
      })
      emitter.on('user-signing-withdraw-error', function () {
        updateUnlockingDashboardOperation({
          status: UnlockingDashboardStatus.UNLOCK_TX_FAILED,
        })

        track?.('staking dashboard - signing withdraw error')
      })
      emitter.on('withdraw-transaction-succeeded', function (receipt) {
        updateUnlockingDashboardOperation({
          status: UnlockingDashboardStatus.UNLOCK_TX_CONFIRMED,
        })

        queryClient.setQueryData(
          stakingPositionQueryKey,
          (old: StakingPosition[] | undefined = []) =>
            old.map(position =>
              position.tokenId === tokenId
                ? { ...position, status: StakingPositionStatus.WITHDRAWN }
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

        track?.('staking dashboard - withdraw success')
      })
      emitter.on('withdraw-transaction-reverted', function (receipt) {
        updateUnlockingDashboardOperation({
          status: UnlockingDashboardStatus.UNLOCK_TX_FAILED,
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
