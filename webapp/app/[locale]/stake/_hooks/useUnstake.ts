import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useUmami } from 'app/analyticsEvents'
import { useTokenBalance } from 'hooks/useBalance'
import { useHemiClient, useHemiWalletClient } from 'hooks/useHemiClient'
import { useNetworkType } from 'hooks/useNetworkType'
import { useState } from 'react'
import { StakeToken, UnstakeStatusEnum } from 'types/stake'
import { unstake } from 'utils/stake'
import { Hash, parseUnits } from 'viem'
import { useAccount } from 'wagmi'

import { getStakedBalanceQueryKey } from './useStakedBalance'

export const useUnstake = function (token: StakeToken) {
  const { address } = useAccount()
  const hemiPublicClient = useHemiClient()
  const { hemiWalletClient } = useHemiWalletClient()
  const [networkType] = useNetworkType()
  const { queryKey: balanceQueryKey } = useTokenBalance(token)

  // Use this state to prevent multiple submissions, and force the animation to run
  // as quickly as the user clicks the button
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [unstakeStatus, setUnstakeStatus] = useState<
    UnstakeStatusEnum | undefined
  >(undefined)

  const [unStakeTransactionHash, setUnstakeTransactionHash] = useState<
    Hash | undefined
  >(undefined)

  const queryClient = useQueryClient()
  const { track } = useUmami()

  const stakedBalanceQueryKey = getStakedBalanceQueryKey({
    address,
    networkType,
    token,
  })

  const { mutate } = useMutation({
    async mutationFn({ amount }: { amount: string }) {
      setIsSubmitting(true)
      track?.('stake - unstake')

      const amountUnits = parseUnits(amount, token.decimals)

      await unstake({
        amount: amountUnits,
        forAccount: address,
        hemiPublicClient,
        hemiWalletClient,
        onUnstake: () => setUnstakeStatus(UnstakeStatusEnum.UNSTAKE_TX_PENDING),
        onUnstakeConfirmed() {
          setUnstakeStatus(UnstakeStatusEnum.UNSTAKE_TX_CONFIRMED)

          // optimistically update staked position and token balance
          queryClient.setQueryData(
            balanceQueryKey,
            (old: bigint) => old + amountUnits,
          )
          queryClient.setQueryData(
            stakedBalanceQueryKey,
            (old: bigint) => old - amountUnits,
          )
        },
        onUnstakeFailed: () =>
          setUnstakeStatus(UnstakeStatusEnum.UNSTAKE_TX_FAILED),
        onUserRejectedUnstake: () =>
          setUnstakeStatus(UnstakeStatusEnum.UNSTAKE_TX_FAILED),
        onUserSignedUnstake: (unstakeTxHash: Hash) =>
          setUnstakeTransactionHash(unstakeTxHash),
        token,
      })
    },
    onSettled() {
      setIsSubmitting(false)
      return Promise.all([
        // invalidate the erc20 balance
        queryClient.invalidateQueries({ queryKey: balanceQueryKey }),
        // Invalidate the staked balance query to refetch the new balance
        queryClient.invalidateQueries({
          queryKey: stakedBalanceQueryKey,
        }),
      ])
    },
  })

  return {
    isSubmitting,
    unstake: mutate,
    unstakeStatus,
    unStakeTransactionHash,
  }
}
