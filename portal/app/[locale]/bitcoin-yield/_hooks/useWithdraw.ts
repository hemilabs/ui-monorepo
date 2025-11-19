import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getBtcStakingVaultContractAddress } from 'hemi-btc-staking-actions'
import { withdraw } from 'hemi-btc-staking-actions/actions'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useUpdateNativeBalanceAfterReceipt } from 'hooks/useInvalidateNativeBalanceAfterReceipt'
import { parseTokenUnits } from 'utils/token'
import { convertToShares } from 'viem-erc4626/actions'
import { useAccount } from 'wagmi'

import {
  type BitcoinYieldWithdrawalOperation,
  BitcoinYieldWithdrawalStatus,
} from '../_types'

import { usePoolAsset } from './usePoolAsset'
import { getPoolDepositsQueryKey } from './usePoolDeposits'
import { getUserPoolBalanceQueryKey } from './useUserPoolBalance'

type UseWithdraw = {
  input: string
  updateBitcoinYieldOperation: (
    payload: BitcoinYieldWithdrawalOperation,
  ) => void
}

export const useWithdraw = function ({
  input,
  updateBitcoinYieldOperation,
}: UseWithdraw) {
  const { data: token } = usePoolAsset()

  const { address } = useAccount()
  const queryClient = useQueryClient()

  const { queryKey: tokenBalanceQueryKey } = useTokenBalance(
    token.chainId,
    token.address,
  )

  const { queryKey: nativeTokenBalanceQueryKey } = useNativeTokenBalance(
    token.chainId,
  )

  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    token.chainId,
  )

  const { hemiWalletClient } = useHemiWalletClient()

  const poolDepositsQueryKey = getPoolDepositsQueryKey(token.chainId)
  const userPoolBalanceQueryKey = getUserPoolBalanceQueryKey(token.chainId)

  return useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error('No account connected')
      }

      const amount = parseTokenUnits(input, token)

      // Convert assets to shares for withdrawal
      // Do not use the useConvertToShares hook here, as we want to read
      // from the contract and the hook may potentially have a cached value
      const shares = await convertToShares(hemiWalletClient!, {
        address: getBtcStakingVaultContractAddress(token.chainId),
        assets: amount,
      })

      const { emitter, promise } = withdraw({
        account: address,
        owner: address,
        receiver: address,
        shares,
        walletClient: hemiWalletClient!,
      })

      emitter.on('user-signed-withdraw', function (transactionHash) {
        updateBitcoinYieldOperation({
          status: BitcoinYieldWithdrawalStatus.WITHDRAW_TX_PENDING,
          transactionHash,
        })
      })

      emitter.on('user-signing-withdraw-error', function () {
        updateBitcoinYieldOperation({
          status: BitcoinYieldWithdrawalStatus.WITHDRAW_TX_FAILED,
        })
      })

      emitter.on('withdraw-transaction-succeeded', function (receipt) {
        updateBitcoinYieldOperation({
          status: BitcoinYieldWithdrawalStatus.WITHDRAW_TX_CONFIRMED,
        })

        // Update balances
        updateNativeBalanceAfterFees(receipt)

        // Update the user token balance (add withdrawn amount)
        queryClient.setQueryData(
          tokenBalanceQueryKey,
          (old: bigint) => old + amount,
        )

        // Update pool deposits (subtract withdrawn amount)
        queryClient.setQueryData(
          poolDepositsQueryKey,
          (old: bigint) => old - amount,
        )

        // Update user pool balance (subtract withdrawn amount)
        queryClient.setQueryData(
          userPoolBalanceQueryKey,
          (old: bigint) => old - amount,
        )
      })

      emitter.on('withdraw-transaction-reverted', function (receipt) {
        updateBitcoinYieldOperation({
          status: BitcoinYieldWithdrawalStatus.WITHDRAW_TX_FAILED,
        })

        // Although the transaction was reverted, the gas was paid.
        updateNativeBalanceAfterFees(receipt)
      })

      emitter.on('withdraw-failed-validation', function () {
        updateBitcoinYieldOperation({
          status: BitcoinYieldWithdrawalStatus.WITHDRAW_TX_FAILED,
        })
      })

      return promise
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey: tokenBalanceQueryKey,
      })

      queryClient.invalidateQueries({
        queryKey: nativeTokenBalanceQueryKey,
      })

      queryClient.invalidateQueries({
        queryKey: poolDepositsQueryKey,
      })

      queryClient.invalidateQueries({
        queryKey: userPoolBalanceQueryKey,
      })
    },
  })
}
