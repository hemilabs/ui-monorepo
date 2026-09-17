import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import { getTokenBalanceQueryKey } from 'hooks/useBalance'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient, useHemiWalletClient } from 'hooks/useHemiClient'
import {
  getEpochRewardsAddress,
  getEpochRewardsLensAddress,
} from 'utils/veHemiEpochRewards'
import type { ClaimEpochRewardsTokenEvents } from 've-hemi-rewards'
import { claimEpochRewardsToken } from 've-hemi-rewards/actions'
import type { Address } from 'viem'
import { useAccount } from 'wagmi'

import { getEpochClaimableByTokenQueryKeyPrefix } from './useEpochClaimableByToken'
import { useEpochSystemState } from './useEpochSystemState'

// Tags the mutation per (position, asset). Only one place starts these today, so the
// in-flight state is read locally - the key exists so a second caller could share it.
const getClaimEpochRewardsTokenMutationKey = ({
  token,
  tokenId,
}: {
  token: Address
  tokenId: bigint
}) => ['claimEpochRewardsToken', tokenId.toString(), token.toLowerCase()]

/**
 * Collects one reward asset for a position - the escape hatch.
 *
 * The whole-registry claim reverts as a whole, so a holder blocked in a single asset
 * could otherwise collect nothing. Same bounds and the same holder-only rule, except
 * that one asset cannot overflow a registry page, leaving only the epoch span.
 */
export const useClaimEpochRewardsToken = function ({
  on,
  token,
  tokenId,
}: {
  on?: (emitter: EventEmitter<ClaimEpochRewardsTokenEvents>) => void
  token: Address
  tokenId: bigint
}) {
  const { address } = useAccount()
  const { id: chainId } = useHemi()
  const hemiClient = useHemiClient()
  const { hemiWalletClient } = useHemiWalletClient()
  const ensureConnectedTo = useEnsureConnectedTo()
  const queryClient = useQueryClient()
  const { data: systemState } = useEpochSystemState()
  const { queryKey: nativeTokenBalanceQueryKey } = useNativeBalance(chainId)

  const lensAddress = getEpochRewardsLensAddress(chainId)
  const rewardsAddress = getEpochRewardsAddress(chainId)

  return useMutation({
    mutationFn: async function runClaimEpochRewardsToken() {
      if (!address) {
        throw new Error('No account connected')
      }
      if (!lensAddress || !rewardsAddress || !systemState) {
        throw new Error('Epoch rewards are not configured for this chain')
      }

      await ensureConnectedTo(chainId)

      const { emitter, promise } = claimEpochRewardsToken({
        chainId,
        fromEpoch: systemState.firstFundableEpoch,
        holder: address,
        lensAddress,
        publicClient: hemiClient,
        rewardsAddress,
        toEpoch: systemState.settledEpoch,
        token,
        tokenId,
        walletClient: hemiWalletClient!,
      })

      // The action reports outcomes through the emitter and always fulfils, so without
      // this the mutation reads `isSuccess` for a claim that reverted or was rejected.
      // Capture the first terminal failure and rethrow it.
      let failure: Error | undefined
      const recordFailure = function (error: Error) {
        failure ??= error
      }
      emitter.on('claim-epoch-token-failed', recordFailure)
      emitter.on('user-signing-claim-epoch-token-error', recordFailure)
      emitter.on('claim-epoch-token-failed-validation', reason =>
        recordFailure(new Error(reason)),
      )
      emitter.on('claim-epoch-token-chunk-reverted', () =>
        recordFailure(new Error('a claim transaction reverted')),
      )
      emitter.on('unexpected-error', recordFailure)

      on?.(emitter)

      await promise

      if (failure) {
        throw failure
      }
    },
    mutationKey: getClaimEpochRewardsTokenMutationKey({ token, tokenId }),
    onSettled() {
      // Re-read rather than writing an optimistic zero. A sequence that stopped
      // part-way collected some chunks and not others, and only the chain knows which.
      queryClient.invalidateQueries({
        queryKey: getEpochClaimableByTokenQueryKeyPrefix({ chainId, tokenId }),
      })

      // Every chunk cost gas, whether or not the sequence finished.
      queryClient.invalidateQueries({ queryKey: nativeTokenBalanceQueryKey })

      // Only this asset's balance can have moved.
      if (address) {
        queryClient.invalidateQueries({
          queryKey: getTokenBalanceQueryKey({
            account: address,
            chainId,
            tokenAddress: token,
          }),
        })
      }
    },
  })
}
