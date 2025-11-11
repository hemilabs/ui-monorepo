import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import { useNativeTokenBalance } from 'hooks/useBalance'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useUpdateNativeBalanceAfterReceipt } from 'hooks/useInvalidateNativeBalanceAfterReceipt'
import { useUmami } from 'hooks/useUmami'
import {
  StakingDashboardOperation,
  StakingDashboardStatus,
  StakingDashboardToken,
  StakingPosition,
} from 'types/stakingDashboard'
import { unixNowTimestamp } from 'utils/time'
import { IncreaseUnlockTimeEvents } from 've-hemi-actions'
import { increaseUnlockTime } from 've-hemi-actions/actions'
import { useAccount } from 'wagmi'

import { daysToSeconds, step } from '../_utils/lockCreationTimes'

import { getStakingPositionsQueryKey } from './useStakingPositions'

type UseIncreaseUnlockTime = {
  lockupDays: number
  on?: (emitter: EventEmitter<IncreaseUnlockTimeEvents>) => void
  token: StakingDashboardToken
  tokenId: string
  updateStakingDashboardOperation: (payload?: StakingDashboardOperation) => void
}

export const useIncreaseUnlockTime = function ({
  lockupDays,
  on,
  token,
  tokenId,
  updateStakingDashboardOperation,
}: UseIncreaseUnlockTime) {
  const { track } = useUmami()
  const { address } = useAccount()
  const queryClient = useQueryClient()

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
    mutationFn: function runIncreaseUnlockTime() {
      if (!address) {
        throw new Error('No account connected')
      }
      const { emitter, promise } = increaseUnlockTime({
        account: address,
        lockDurationInSeconds: daysToSeconds(lockupDays),
        tokenId: BigInt(tokenId),
        walletClient: hemiWalletClient!,
      })

      emitter.on(
        'user-signed-increase-unlock-time',
        function (transactionHash) {
          updateStakingDashboardOperation({
            stakingPosition: {
              lockTime: daysToSeconds(BigInt(lockupDays)),
              tokenId,
            },
            status: StakingDashboardStatus.STAKE_TX_PENDING,
            transactionHash,
          })

          track?.('staking dashboard - signed increase unlock time')
        },
      )
      emitter.on('user-signing-increase-unlock-time-error', function () {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.STAKE_TX_FAILED,
        })

        track?.('staking dashboard - signing increase unlock time error')
      })
      emitter.on(
        'increase-unlock-time-transaction-succeeded',
        function (receipt) {
          updateStakingDashboardOperation({
            status: StakingDashboardStatus.STAKE_TX_CONFIRMED,
          })

          queryClient.setQueryData(
            stakingPositionQueryKey,
            (old: StakingPosition[] | undefined = []) =>
              old.map(function (position) {
                if (position.tokenId !== tokenId) {
                  return position
                }

                // Calculate new unlock time (current time + chosen duration, rounded)
                const rawUnlockTime =
                  unixNowTimestamp() + daysToSeconds(BigInt(lockupDays))
                const newUnlockTime =
                  (rawUnlockTime / BigInt(step)) * BigInt(step)

                // New lockTime is duration from original start to new end
                const newLockTime = newUnlockTime - BigInt(position.timestamp)

                return {
                  ...position,
                  lockTime: newLockTime,
                }
              }),
          )

          // fees
          updateNativeBalanceAfterFees(receipt)

          track?.('staking dashboard - increase unlock time success')
        },
      )
      emitter.on(
        'increase-unlock-time-transaction-reverted',
        function (receipt) {
          updateStakingDashboardOperation({
            status: StakingDashboardStatus.STAKE_TX_FAILED,
          })

          // Although the transaction was reverted, the gas was paid.
          updateNativeBalanceAfterFees(receipt)

          track?.(
            'staking dashboard - increase unlock time transaction reverted',
          )
        },
      )

      on?.(emitter)

      return promise
    },
    onSettled() {
      // Do not return the promises here. Doing so will delay the resolution of
      // the mutation, which will cause the UI to be out of sync until balances are re-validated.
      // Query invalidation here must work as fire and forget, as, after all, it runs in the background!

      queryClient.invalidateQueries({
        queryKey: nativeTokenBalanceQueryKey,
      })
    },
  })
}
