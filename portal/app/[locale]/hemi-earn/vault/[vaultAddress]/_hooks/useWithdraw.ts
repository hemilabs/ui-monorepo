import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { useUpdateNativeBalanceAfterReceipt } from '@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import { type WithdrawEvents } from 'hemi-earn-actions'
import { withdraw } from 'hemi-earn-actions/actions'
import { useTokenBalance } from 'hooks/useBalance'
import { parseTokenUnits } from 'utils/token'
import { erc4626Abi, parseEventLogs } from 'viem'
import { convertToShares } from 'viem-erc4626/actions'
import { useAccount, useConfig } from 'wagmi'
import { getWalletClient } from 'wagmi/actions'

import { earnPoolsKeyPrefix } from '../../../_hooks/useEarnPools'
import { earnPositionsKeyPrefix } from '../../../_hooks/useEarnPositions'
import { totalDepositsKeyPrefix } from '../../../_hooks/useTotalDeposits'
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
  const chainId = pool.token.chainId
  const config = useConfig()
  const ensureConnectedTo = useEnsureConnectedTo()
  const queryClient = useQueryClient()

  const { queryKey: tokenBalanceQueryKey } = useTokenBalance(
    chainId,
    pool.token.address,
  )

  const { queryKey: nativeTokenBalanceQueryKey } = useNativeBalance(chainId)

  const updateNativeBalanceAfterFees =
    useUpdateNativeBalanceAfterReceipt(chainId)

  return useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error('No account connected')
      }

      await ensureConnectedTo(chainId)

      const walletClient = await getWalletClient(config, { chainId })

      const amount = parseTokenUnits(input, pool.token)

      // Convert assets to shares for withdrawal.
      // Read from the contract directly (not from a cached hook) to get a fresh value.
      const shares = await convertToShares(walletClient, {
        address: pool.vaultAddress,
        assets: amount,
      })

      const { emitter, promise } = withdraw({
        owner: address,
        receiver: address,
        shares,
        vaultAddress: pool.vaultAddress,
        walletClient,
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

        const [withdrawLog] = parseEventLogs({
          abi: erc4626Abi,
          eventName: 'Withdraw',
          logs: receipt.logs,
        })

        if (withdrawLog) {
          const { assets } = withdrawLog.args

          // Update token balance
          queryClient.setQueryData(
            tokenBalanceQueryKey,
            (old: bigint | undefined) =>
              old === undefined ? old : old + assets,
          )

          // Update vault balance
          queryClient.setQueryData(
            getUserVaultBalanceQueryKey({
              chainId,
              vaultAddress: pool.vaultAddress,
            }),
            (old: bigint | undefined) =>
              old === undefined ? old : old > assets ? old - assets : BigInt(0),
          )
        }
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
        queryKey: earnPoolsKeyPrefix,
      })
      queryClient.invalidateQueries({
        queryKey: getUserVaultBalanceQueryKey({
          chainId,
          vaultAddress: pool.vaultAddress,
        }),
      })
      queryClient.invalidateQueries({
        queryKey: earnPositionsKeyPrefix,
      })
      queryClient.invalidateQueries({
        queryKey: totalDepositsKeyPrefix,
      })
    },
  })
}
