import { useMutation, useQueryClient } from '@tanstack/react-query'
import { stakeManagerAddresses } from 'hemi-viem-stake-actions'
import { useAllowance } from 'hooks/useAllowance'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useHemiClient, useHemiWalletClient } from 'hooks/useHemiClient'
import { useNetworkType } from 'hooks/useNetworkType'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { StakeStatusEnum, StakeToken } from 'types/stake'
import { isNativeToken } from 'utils/nativeToken'
import { stake } from 'utils/stake'
import { parseTokenUnits } from 'utils/token'
import { Hash } from 'viem'
import { useAccount } from 'wagmi'

import { getStakedBalanceQueryKey } from './useStakedBalance'

export const useStake = function (token: StakeToken) {
  const operatesNativeToken = isNativeToken(token)
  const { address } = useAccount()
  const { queryKey: allowanceQueryKey } = useAllowance(token.address, {
    args: { owner: address, spender: stakeManagerAddresses[token.chainId] },
  })
  const [networkType] = useNetworkType()
  const hemiPublicClient = useHemiClient()
  const { hemiWalletClient } = useHemiWalletClient()
  const { queryKey: erc20BalanceQueryKey } = useTokenBalance(
    token.chainId,
    token.address,
  )
  const { queryKey: nativeTokenBalanceQueryKey } = useNativeTokenBalance(
    token.chainId,
  )

  const balanceQueryKey = operatesNativeToken
    ? nativeTokenBalanceQueryKey
    : erc20BalanceQueryKey

  // Use this state to prevent multiple submissions, and force the animation to run
  // as quickly as the user clicks the button
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [stakeStatus, setStakeStatus] = useState<StakeStatusEnum | undefined>(
    undefined,
  )
  const [approvalTxHash, setApprovalTxHash] = useState<Hash | undefined>(
    undefined,
  )
  const [stakeTransactionHash, setStakeTransactionHash] = useState<
    Hash | undefined
  >(undefined)

  const queryClient = useQueryClient()
  const t = useTranslations()
  const { track } = useUmami()

  const stakedBalanceQueryKey = getStakedBalanceQueryKey({
    address,
    networkType,
    token,
  })

  const { mutate } = useMutation({
    async mutationFn({ amountInput }: { amountInput: string }) {
      setIsSubmitting(true)
      track?.('stake - stake started')

      const amountUnits = parseTokenUnits(amountInput, token)

      await stake({
        amountInput,
        forAccount: address,
        hemiPublicClient,
        hemiWalletClient,
        onStake: () => setStakeStatus(StakeStatusEnum.STAKE_TX_PENDING),
        onStakeConfirmed() {
          setStakeStatus(StakeStatusEnum.STAKE_TX_CONFIRMED)

          // optimistically update staked balance and token balance
          queryClient.setQueryData(
            balanceQueryKey,
            (old: bigint) => old - amountUnits,
          )
          queryClient.setQueryData(
            stakedBalanceQueryKey,
            (old: bigint) => old + amountUnits,
          )

          track?.('stake - stake success')
        },
        onStakeFailed() {
          setStakeStatus(StakeStatusEnum.STAKE_TX_FAILED)
          track?.('stake - stake failed')
        },
        onStakeTokenApprovalFailed: () =>
          setStakeStatus(StakeStatusEnum.APPROVAL_TX_FAILED),
        onStakeTokenApproved() {
          setStakeStatus(StakeStatusEnum.APPROVAL_TX_COMPLETED)
          if (!operatesNativeToken) {
            // invalidate allowance after an erc20 approval took place
            queryClient.invalidateQueries({ queryKey: allowanceQueryKey })
          }
        },
        onTokenApprove: () =>
          setStakeStatus(StakeStatusEnum.APPROVAL_TX_PENDING),
        onUserRejectedStake: () =>
          setStakeStatus(StakeStatusEnum.STAKE_TX_FAILED),
        onUserRejectedTokenApproval: () =>
          setStakeStatus(StakeStatusEnum.APPROVAL_TX_FAILED),
        onUserSignedStake(txHash) {
          setStakeTransactionHash(txHash)
          setStakeStatus(StakeStatusEnum.STAKE_TX_PENDING)
        },
        onUserSignedTokenApproval: txHash => setApprovalTxHash(txHash),
        t,
        token,
      })
    },
    onSettled() {
      setIsSubmitting(false)
      return Promise.all([
        // invalidate the wallet balance
        queryClient.invalidateQueries({ queryKey: balanceQueryKey }),
        // Invalidate the staked balance query to refetch the new balance
        queryClient.invalidateQueries({
          queryKey: stakedBalanceQueryKey,
        }),
      ])
    },
  })

  return {
    approvalTxHash,
    isSubmitting,
    stake: mutate,
    stakeStatus,
    stakeTransactionHash,
  }
}
