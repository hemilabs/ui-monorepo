import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { useUpdateNativeBalanceAfterReceipt } from '@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import { type WithdrawEvents } from 'hemi-earn-actions'
import { withdraw } from 'hemi-earn-actions/actions'
import { useTokenBalance } from 'hooks/useBalance'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { parseTokenUnits } from 'utils/token'
import { convertToShares } from 'viem-erc4626/actions'
import { useAccount } from 'wagmi'

import { type EarnPool } from '../../../types'
import {
  type VaultWithdrawOperation,
  VaultWithdrawStatus,
} from '../_types/vaultOperations'

import { useDrawerVaultQueryString } from './useDrawerVaultQueryString'
import { getUserVaultBalanceQueryKey } from './useUserVaultBalance'

type UseWithdraw = {
  input: string
  on?: (emitter: EventEmitter<WithdrawEvents>) => void
  pool: EarnPool
  updateWithdrawOperation: (payload?: VaultWithdrawOperation) => void
}

export const useWithdraw = function ({
  input,
  on,
  pool,
  updateWithdrawOperation,
}: UseWithdraw) {
  const { setDrawerQueryString } = useDrawerVaultQueryString()
  const { address } = useAccount()
  const hemi = useHemi()
  const ensureConnectedTo = useEnsureConnectedTo()
  const queryClient = useQueryClient()

  const { queryKey: tokenBalanceQueryKey } = useTokenBalance(
    pool.token.chainId,
    pool.token.address,
  )

  const { queryKey: nativeTokenBalanceQueryKey } = useNativeBalance(
    pool.token.chainId,
  )

  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    pool.token.chainId,
  )

  const { hemiWalletClient } = useHemiWalletClient()

  return useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error('No account connected')
      }

      await ensureConnectedTo(hemi.id)

      const amount = parseTokenUnits(input, pool.token)

      // Convert assets to shares for withdrawal.
      // Read from the contract directly (not from a cached hook) to get a fresh value.
      const shares = await convertToShares(hemiWalletClient!, {
        address: pool.vaultAddress,
        assets: amount,
      })

      const { emitter, promise } = withdraw({
        owner: address,
        receiver: address,
        shares,
        vaultAddress: pool.vaultAddress,
        walletClient: hemiWalletClient!,
      })

      emitter.on('user-signed-withdraw', function (transactionHash) {
        updateWithdrawOperation({
          status: VaultWithdrawStatus.WITHDRAW_TX_PENDING,
          transactionHash,
        })
        setDrawerQueryString('withdrawing')
      })

      emitter.on('user-signing-withdraw-error', function () {
        updateWithdrawOperation({
          status: VaultWithdrawStatus.WITHDRAW_TX_FAILED,
        })
      })

      emitter.on('withdraw-transaction-succeeded', function (receipt) {
        updateWithdrawOperation({
          status: VaultWithdrawStatus.WITHDRAW_TX_CONFIRMED,
        })

        updateNativeBalanceAfterFees(receipt)

        // Update token balance (add withdrawn amount)
        queryClient.setQueryData(
          tokenBalanceQueryKey,
          (old: bigint) => old + amount,
        )
      })

      emitter.on('withdraw-transaction-reverted', function (receipt) {
        updateWithdrawOperation({
          status: VaultWithdrawStatus.WITHDRAW_TX_FAILED,
        })
        updateNativeBalanceAfterFees(receipt)
      })

      emitter.on('withdraw-failed-validation', function () {
        updateWithdrawOperation({
          status: VaultWithdrawStatus.WITHDRAW_TX_FAILED,
        })
      })

      on?.(emitter)

      return promise
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: tokenBalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: nativeTokenBalanceQueryKey })
      queryClient.invalidateQueries({
        queryKey: ['hemi-earn', 'pools', hemi.id],
      })
      queryClient.invalidateQueries({
        queryKey: getUserVaultBalanceQueryKey({
          chainId: hemi.id,
          vaultAddress: pool.vaultAddress,
        }),
      })
      queryClient.invalidateQueries({
        queryKey: ['hemi-earn', 'positions', hemi.id, address],
      })
    },
  })
}
