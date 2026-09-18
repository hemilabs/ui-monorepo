import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { useUpdateNativeBalanceAfterReceipt } from '@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import { getTokenBalanceQueryKey } from 'hooks/useBalance'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useUmami } from 'hooks/useUmami'
import {
  CaptureDashboardStatus,
  StakingDashboardToken,
  StakingPosition,
  StakingPositionStatus,
  UnlockingDashboardOperation,
  UnlockingDashboardStatus,
} from 'types/stakingDashboard'
import { getVeHemiContractAddress } from 've-hemi-actions'
import type { CaptureAndWithdrawEvents } from 've-hemi-epoch-rewards'
import { captureAndWithdraw } from 've-hemi-epoch-rewards/actions'
import { useAccount } from 'wagmi'

import { useDrawerStakingQueryString } from './useDrawerStakingQueryString'
import { useNeedsClassCapture } from './useNeedsClassCapture'
import { getPositionsVotingPowerSumQueryKeyPrefix } from './usePositionsVotingPowerSum'
import { getStakingPositionsQueryKey } from './useStakingPositions'
import { getTotalVotingPowerQueryKey } from './useTotalVotingPower'

type UseUnlock = {
  amount: bigint
  on?: (emitter: EventEmitter<CaptureAndWithdrawEvents>) => void
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
  const { data: needsCapture } = useNeedsClassCapture(tokenId)
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

      updateUnlockingDashboardOperation({
        captureStatus: undefined,
        captureTransactionHash: undefined,
        needsCapture,
        stakingPosition: { amount, tokenId },
        status: undefined,
        transactionHash: undefined,
      })

      const { emitter, promise } = captureAndWithdraw({
        account: address,
        tokenId,
        veHemiAddress: getVeHemiContractAddress(token.chainId),
        walletClient: hemiWalletClient!,
      })

      emitter.on('capture-not-needed', function () {
        updateUnlockingDashboardOperation({ needsCapture: false })
      })
      emitter.on('user-signed-capture', function (transactionHash) {
        updateUnlockingDashboardOperation({
          captureStatus: CaptureDashboardStatus.CAPTURE_TX_PENDING,
          captureTransactionHash: transactionHash,
          needsCapture: true,
        })
        setDrawerQueryString('unlocking')

        track?.('hemi stake - signed capture position class')
      })
      emitter.on('user-signing-capture-error', function () {
        updateUnlockingDashboardOperation({
          captureStatus: CaptureDashboardStatus.CAPTURE_TX_FAILED,
        })
      })
      emitter.on('capture-failed', function () {
        updateUnlockingDashboardOperation({
          captureStatus: CaptureDashboardStatus.CAPTURE_TX_FAILED,
        })
      })
      emitter.on('capture-transaction-succeeded', function (receipt) {
        updateUnlockingDashboardOperation({
          captureStatus: CaptureDashboardStatus.CAPTURE_TX_CONFIRMED,
          captureTransactionHash: receipt.transactionHash,
        })

        updateNativeBalanceAfterFees(receipt)
      })
      emitter.on('capture-transaction-reverted', function (receipt) {
        updateUnlockingDashboardOperation({
          captureStatus: CaptureDashboardStatus.CAPTURE_TX_FAILED,
          captureTransactionHash: receipt.transactionHash,
        })

        updateNativeBalanceAfterFees(receipt)

        track?.('hemi stake - capture position class reverted')
      })
      // `needsCapture` starts as a guess, read before anything is signed. This is what
      // the capture actually turned out to be, which is what the drawer must render: a
      // failure that never reached the capture has no capture step to show, and the
      // guess would flash one for a frame before the emitter corrected it.
      let captureStarted = false
      emitter.on('pre-capture', function () {
        captureStarted = true
      })

      // A failure before the signature still opens the drawer. Without it the click
      // renders nothing at all, and the holder is left with a button that did not
      // visibly do anything.
      const failBeforeSigning = function () {
        updateUnlockingDashboardOperation({
          needsCapture: captureStarted,
          status: UnlockingDashboardStatus.UNLOCK_TX_FAILED,
        })
        setDrawerQueryString('unlocking')
      }
      // The capture is a precondition of the burn, so a refusal stops the unlock
      // before anyone is asked to sign it.
      emitter.on('withdraw-failed-validation', failBeforeSigning)
      // The burn simulation refuses what veHEMI would refuse -- a position that is not
      // the caller's, above all -- and it also covers a node that failed to answer.
      emitter.on('withdraw-failed', failBeforeSigning)
      emitter.on('user-signed-withdraw', function (transactionHash) {
        updateUnlockingDashboardOperation({
          stakingPosition: { amount, tokenId },
          status: UnlockingDashboardStatus.UNLOCK_TX_PENDING,
          transactionHash,
        })
        setDrawerQueryString('unlocking')

        track?.('hemi stake - signed withdraw')
      })
      emitter.on('user-signing-withdraw-error', function () {
        updateUnlockingDashboardOperation({
          status: UnlockingDashboardStatus.UNLOCK_TX_FAILED,
        })

        track?.('hemi stake - signing withdraw error')
      })
      emitter.on('withdraw-transaction-succeeded', function (receipt) {
        updateUnlockingDashboardOperation({
          status: UnlockingDashboardStatus.UNLOCK_TX_CONFIRMED,
          transactionHash: receipt.transactionHash,
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

        track?.('hemi stake - withdraw success')
      })
      emitter.on('withdraw-transaction-reverted', function (receipt) {
        updateUnlockingDashboardOperation({
          status: UnlockingDashboardStatus.UNLOCK_TX_FAILED,
          transactionHash: receipt.transactionHash,
        })

        // Although the transaction was reverted, the gas was paid.
        updateNativeBalanceAfterFees(receipt)

        track?.('hemi stake - withdraw transaction reverted')
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
