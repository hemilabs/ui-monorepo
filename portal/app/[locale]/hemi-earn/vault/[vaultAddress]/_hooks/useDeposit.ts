import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { useUpdateNativeBalanceAfterReceipt } from '@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import { type DepositEvents } from 'hemi-earn-actions'
import { depositToken } from 'hemi-earn-actions/actions'
import { useTokenBalance } from 'hooks/useBalance'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { buildAllowanceQueryKey } from 'utils/allowanceQueryKey'
import { parseTokenUnits } from 'utils/token'
import { useAccount } from 'wagmi'

import { type EarnPool } from '../../../types'
import {
  type VaultDepositOperation,
  VaultDepositStatus,
} from '../_types/vaultOperations'

import { useDrawerVaultQueryString } from './useDrawerVaultQueryString'
import { getUserVaultBalanceQueryKey } from './useUserVaultBalance'

type UseDeposit = {
  input: string
  on?: (emitter: EventEmitter<DepositEvents>) => void
  pool: EarnPool
  updateDepositOperation: (payload?: VaultDepositOperation) => void
}

export const useDeposit = function ({
  input,
  on,
  pool,
  updateDepositOperation,
}: UseDeposit) {
  const amount = parseTokenUnits(input, pool.token)

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

  const allowanceQueryKey = buildAllowanceQueryKey({
    chainId: pool.token.chainId,
    owner: address,
    spender: pool.vaultAddress,
    tokenAddress: pool.token.address,
  })

  return useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error('No account connected')
      }

      await ensureConnectedTo(hemi.id)

      const { emitter, promise } = depositToken({
        account: address,
        amount,
        vaultAddress: pool.vaultAddress,
        walletClient: hemiWalletClient!,
      })

      emitter.on('user-signed-approval', function (approvalTxHash) {
        updateDepositOperation({
          approvalTxHash,
          status: VaultDepositStatus.APPROVAL_TX_PENDING,
          transactionHash: undefined,
        })
        setDrawerQueryString('depositing')
      })

      emitter.on('approve-transaction-reverted', function (receipt) {
        updateDepositOperation({
          status: VaultDepositStatus.APPROVAL_TX_FAILED,
        })
        updateNativeBalanceAfterFees(receipt)
      })

      emitter.on('approve-transaction-succeeded', function (receipt) {
        updateDepositOperation({
          status: VaultDepositStatus.APPROVAL_TX_COMPLETED,
        })
        updateNativeBalanceAfterFees(receipt)
        queryClient.invalidateQueries({ queryKey: allowanceQueryKey })
      })

      emitter.on('user-signing-approval-error', function () {
        updateDepositOperation({
          status: VaultDepositStatus.APPROVAL_TX_FAILED,
        })
      })

      emitter.on('user-signed-deposit', function (transactionHash) {
        updateDepositOperation({
          status: VaultDepositStatus.DEPOSIT_TX_PENDING,
          transactionHash,
        })
        setDrawerQueryString('depositing')
      })

      emitter.on('deposit-transaction-succeeded', function (receipt) {
        updateDepositOperation({
          status: VaultDepositStatus.DEPOSIT_TX_CONFIRMED,
        })

        updateNativeBalanceAfterFees(receipt)

        // Update token balance (subtract deposited amount)
        queryClient.setQueryData(
          tokenBalanceQueryKey,
          (old: bigint) => old - amount,
        )
      })

      emitter.on('deposit-transaction-reverted', function (receipt) {
        updateDepositOperation({
          status: VaultDepositStatus.DEPOSIT_TX_FAILED,
        })
        updateNativeBalanceAfterFees(receipt)
      })

      emitter.on('user-signing-deposit-error', function () {
        updateDepositOperation({
          status: VaultDepositStatus.DEPOSIT_TX_FAILED,
        })
      })

      emitter.on('deposit-failed-validation', function () {
        updateDepositOperation({
          status: VaultDepositStatus.DEPOSIT_TX_FAILED,
        })
      })

      on?.(emitter)

      return promise
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: tokenBalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: allowanceQueryKey })
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
