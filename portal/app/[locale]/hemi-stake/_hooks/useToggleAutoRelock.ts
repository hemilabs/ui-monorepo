import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { useUpdateNativeBalanceAfterReceipt } from '@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useUmami } from 'hooks/useUmami'
import {
  type StakingDashboardOperation,
  StakingDashboardStatus,
  type StakingDashboardToken,
} from 'types/stakingDashboard'
import { AutoRelockEvents } from 've-hemi-actions'
import { toggleAutoRelock } from 've-hemi-actions/actions'
import { useAccount } from 'wagmi'

import { getPositionDelegationDetailsQueryKey } from './usePositionDelegationDetails'
import { getPositionsVotingPowerSumQueryKeyPrefix } from './usePositionsVotingPowerSum'
import { getPositionWeightQueryKeyPrefix } from './usePositionWeight'
import { getStakingPositionsQueryKey } from './useStakingPositions'
import { getTotalVotingPowerQueryKey } from './useTotalVotingPower'

type UseToggleAutoRelock = {
  enable: boolean
  on?: (emitter: EventEmitter<AutoRelockEvents>) => void
  token: StakingDashboardToken
  tokenId: bigint
  updateStakingDashboardOperation: (payload?: StakingDashboardOperation) => void
}

export const useToggleAutoRelock = function ({
  enable,
  on,
  token,
  tokenId,
  updateStakingDashboardOperation,
}: UseToggleAutoRelock) {
  const { track } = useUmami()
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const ensureConnectedTo = useEnsureConnectedTo()

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
    mutationFn: async function runToggleAutoRelock() {
      await ensureConnectedTo(token.chainId)

      if (!address) {
        throw new Error('No account connected')
      }

      updateStakingDashboardOperation({
        status: StakingDashboardStatus.STAKE_TX_PENDING,
        transactionHash: undefined,
      })

      const { emitter, promise } = toggleAutoRelock({
        account: address,
        enable,
        tokenId,
        walletClient: hemiWalletClient!,
      })

      emitter.on('user-signed-auto-relock', function (transactionHash) {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.STAKE_TX_PENDING,
          transactionHash,
        })

        track?.('hemi stake - signed auto relock')
      })
      emitter.on('auto-relock-failed-validation', function () {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.STAKE_TX_FAILED,
        })

        track?.('hemi stake - auto relock failed validation')
      })
      emitter.on('user-signing-auto-relock-error', function () {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.STAKE_TX_FAILED,
        })

        track?.('hemi stake - signing auto relock error')
      })
      emitter.on('auto-relock-failed', function () {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.STAKE_TX_FAILED,
        })

        track?.('hemi stake - auto relock failed')
      })
      emitter.on('auto-relock-transaction-succeeded', function (receipt) {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.STAKE_TX_CONFIRMED,
        })

        updateNativeBalanceAfterFees(receipt)

        track?.('hemi stake - auto relock success')
      })
      emitter.on('auto-relock-transaction-reverted', function (receipt) {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.STAKE_TX_FAILED,
        })

        updateNativeBalanceAfterFees(receipt)

        track?.('hemi stake - auto relock reverted')
      })
      emitter.on('unexpected-error', function () {
        updateStakingDashboardOperation({
          status: StakingDashboardStatus.STAKE_TX_FAILED,
        })

        track?.('hemi stake - unexpected error')
      })

      on?.(emitter)

      return promise
    },
    onError() {
      updateStakingDashboardOperation({
        status: StakingDashboardStatus.STAKE_TX_FAILED,
      })
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: stakingPositionQueryKey })
      queryClient.invalidateQueries({
        queryKey: nativeTokenBalanceQueryKey,
      })
      queryClient.invalidateQueries({
        queryKey: getPositionWeightQueryKeyPrefix({
          chainId: token.chainId,
          tokenId,
        }),
      })

      if (address) {
        queryClient.invalidateQueries({
          queryKey: getPositionDelegationDetailsQueryKey({
            chainId: token.chainId,
            ownerAddress: address,
            tokenId,
          }),
        })
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
