import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { useUpdateNativeBalanceAfterReceipt } from '@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import { getTokenBalanceQueryKey } from 'hooks/useBalance'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useUmami } from 'hooks/useUmami'
import {
  StakingDashboardToken,
  StakingPosition,
  StakingPositionStatus,
  UnlockingDashboardOperation,
  UnlockingDashboardStatus,
} from 'types/stakingDashboard'
import { getEpochRewardsAddress } from 'utils/veHemiEpochRewards'
import { WithdrawEvents } from 've-hemi-actions'
import { withdraw } from 've-hemi-actions/actions'
import { useAccount } from 'wagmi'

import { useDrawerStakingQueryString } from './useDrawerStakingQueryString'
import { getPositionsVotingPowerSumQueryKeyPrefix } from './usePositionsVotingPowerSum'
import { getStakingPositionsQueryKey } from './useStakingPositions'
import { getTotalVotingPowerQueryKey } from './useTotalVotingPower'

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
  const hemiBalanceQueryKey = getTokenBalanceQueryKey({
    account: address,
    chainId: token.chainId,
    tokenAddress: token.address,
  })

  const stakingPositionQueryKey = getStakingPositionsQueryKey({
    address,
    chainId: token.chainId,
  })

  const { queryKey: nativeTokenBalanceQueryKey } = useNativeBalance(
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
        // `undefined` means the continuous-accrual contract, where burning destroys
        // nothing. An address means the class has to be recorded before the burn.
        epochRewardsAddress: getEpochRewardsAddress(token.chainId),
        tokenId,
        walletClient: hemiWalletClient!,
      })

      // Where the epoch contract is deployed the withdraw action records the class
      // first. Surfaced as its own step rather than an unexplained second prompt.
      emitter.on('pre-capture-position-class', function () {
        updateUnlockingDashboardOperation({
          requiresClassCapture: true,
          stakingPosition: { amount, tokenId },
          status: UnlockingDashboardStatus.CAPTURE_TX_PENDING,
        })
        setDrawerQueryString('unlocking')

        track?.('staking dashboard - capture position class')
      })
      emitter.on(
        'user-signed-capture-position-class',
        function (transactionHash) {
          updateUnlockingDashboardOperation({
            requiresClassCapture: true,
            stakingPosition: { amount, tokenId },
            status: UnlockingDashboardStatus.CAPTURE_TX_PENDING,
            transactionHash,
          })
        },
      )
      // Each of these carries the position and opens the drawer itself. The review
      // renders from `stakingPosition`, and `capture-position-class-failed` can fire
      // before `pre-capture-position-class` (the guard's reads run first), when nothing
      // has opened the drawer yet.
      const captureFailed = function () {
        updateUnlockingDashboardOperation({
          requiresClassCapture: true,
          stakingPosition: { amount, tokenId },
          status: UnlockingDashboardStatus.CAPTURE_TX_FAILED,
        })
        setDrawerQueryString('unlocking')
      }

      emitter.on('user-signing-capture-position-class-error', function () {
        captureFailed()
        track?.('staking dashboard - signing capture position class error')
      })
      emitter.on('capture-position-class-failed', function () {
        captureFailed()
        track?.('staking dashboard - capture position class failed')
      })
      emitter.on(
        'capture-position-class-transaction-reverted',
        function (receipt) {
          updateUnlockingDashboardOperation({
            requiresClassCapture: true,
            stakingPosition: { amount, tokenId },
            status: UnlockingDashboardStatus.CAPTURE_TX_FAILED,
          })
          setDrawerQueryString('unlocking')

          // Reverted, but the gas was still paid.
          updateNativeBalanceAfterFees(receipt)

          track?.('staking dashboard - capture position class reverted')
        },
      )

      emitter.on('user-signed-withdraw', function (transactionHash) {
        updateUnlockingDashboardOperation({
          stakingPosition: { amount, tokenId },
          status: UnlockingDashboardStatus.UNLOCK_TX_PENDING,
          transactionHash,
        })
        setDrawerQueryString('unlocking')

        track?.('staking dashboard - signed withdraw')
      })
      // The burn can be refused before anything is signed - the capture guard
      // declining, or a validation failure - leaving the drawer stuck on pending.
      const withdrawFailed = function () {
        updateUnlockingDashboardOperation({
          stakingPosition: { amount, tokenId },
          status: UnlockingDashboardStatus.UNLOCK_TX_FAILED,
          // Cleared: the capture step did send a transaction, and carrying its hash
          // over puts a confirmed explorer link under the step that failed.
          transactionHash: undefined,
        })
        setDrawerQueryString('unlocking')
      }
      emitter.on('user-signing-withdraw-error', function () {
        // Carries the position and opens the drawer, like every other failure handler.
        // Without the position this made a truthy operation with no `stakingPosition`,
        // which passed the drawer's guard and then crashed `ReviewUnlock` - taking the
        // dashboard to the route error page on a plain wallet rejection.
        withdrawFailed()

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
      emitter.on('withdraw-failed', function () {
        withdrawFailed()
        track?.('staking dashboard - withdraw failed')
      })
      emitter.on('withdraw-failed-validation', function () {
        withdrawFailed()
        track?.('staking dashboard - withdraw failed validation')
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

      if (address) {
        queryClient.invalidateQueries({
          queryKey: getTotalVotingPowerQueryKey({
            address,
            chainId: token.chainId,
          }),
        })
        queryClient.invalidateQueries({
          queryKey: getPositionsVotingPowerSumQueryKeyPrefix({
            chainId: token.chainId,
            ownerAddress: address,
          }),
        })
      }
    },
  })
}
