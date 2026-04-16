import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { useUpdateNativeBalanceAfterReceipt } from '@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import { type DepositEvents } from 'hemi-earn-actions'
import { depositToken } from 'hemi-earn-actions/actions'
import { useTokenBalance } from 'hooks/useBalance'
import { buildAllowanceQueryKey } from 'utils/allowanceQueryKey'
import { parseTokenUnits } from 'utils/token'
import { erc4626Abi, parseEventLogs } from 'viem'
import { useAccount, useConfig } from 'wagmi'
import { getWalletClient } from 'wagmi/actions'

import { earnPoolsKeyPrefix } from '../../../_hooks/useEarnPools'
import { earnPositionsKeyPrefix } from '../../../_hooks/useEarnPositions'
import { totalDepositsKeyPrefix } from '../../../_hooks/useTotalDeposits'
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
  const chainId = pool.token.chainId

  const { setDrawerQueryString } = useDrawerVaultQueryString()
  const { address } = useAccount()
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

  const allowanceQueryKey = buildAllowanceQueryKey({
    chainId,
    owner: address,
    spender: pool.vaultAddress,
    tokenAddress: pool.token.address,
  })

  return useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error('No account connected')
      }

      await ensureConnectedTo(chainId)

      const walletClient = await getWalletClient(config, { chainId })

      const { emitter, promise } = depositToken({
        account: address,
        amount,
        vaultAddress: pool.vaultAddress,
        walletClient,
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

        const [depositLog] = parseEventLogs({
          abi: erc4626Abi,
          eventName: 'Deposit',
          logs: receipt.logs,
        })

        if (depositLog) {
          const { assets } = depositLog.args

          // Update token balance
          queryClient.setQueryData(
            tokenBalanceQueryKey,
            (old: bigint | undefined) =>
              old === undefined ? old : old - assets,
          )

          // Update vault balance
          queryClient.setQueryData(
            getUserVaultBalanceQueryKey({
              chainId,
              vaultAddress: pool.vaultAddress,
            }),
            (old: bigint | undefined) =>
              old === undefined ? old : old + assets,
          )
        }
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
