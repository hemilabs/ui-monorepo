import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getBtcStakingVaultContractAddress } from 'hemi-btc-staking-actions'
import { depositToken } from 'hemi-btc-staking-actions/actions'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useEnsureConnectedTo } from 'hooks/useEnsureConnectedTo'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import { useUpdateNativeBalanceAfterReceipt } from 'hooks/useInvalidateNativeBalanceAfterReceipt'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import { parseTokenUnits } from 'utils/token'
import { useAccount } from 'wagmi'

import {
  type BitcoinYieldDepositOperation,
  BitcoinYieldDepositStatus,
} from '../_types'

import { usePoolAsset } from './usePoolAsset'
import { getPoolDepositsQueryKey } from './usePoolDeposits'
import { getUserPoolBalanceQueryKey } from './useUserPoolBalance'

type UseDeposit = {
  input: string
  updateBitcoinYieldOperation: (payload: BitcoinYieldDepositOperation) => void
}

export const useDeposit = function ({
  input,
  updateBitcoinYieldOperation,
}: UseDeposit) {
  const { data: token } = usePoolAsset()
  const amount = parseTokenUnits(input, token)

  const { address } = useAccount()
  const hemi = useHemi()
  const ensureConnectedTo = useEnsureConnectedTo()
  const vaultAddress = getBtcStakingVaultContractAddress(token.chainId)
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

  const { allowanceQueryKey } = useNeedsApproval({
    address: token.address,
    amount,
    chainId: token.chainId,
    spender: vaultAddress,
  })

  const poolDepositsQueryKey = getPoolDepositsQueryKey(token.chainId)
  const userPoolBalanceQueryKey = getUserPoolBalanceQueryKey(token.chainId)

  return useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error('No account connected')
      }

      await ensureConnectedTo(hemi.id)

      const { emitter, promise } = depositToken({
        account: address,
        amount,
        receiver: address,
        walletClient: hemiWalletClient!,
      })

      emitter.on('pre-approve', function () {
        updateBitcoinYieldOperation({
          status: BitcoinYieldDepositStatus.APPROVAL_TX_PENDING,
        })
      })

      emitter.on('user-signed-approval', function (approvalTxHash) {
        updateBitcoinYieldOperation({
          approvalTxHash,
          status: BitcoinYieldDepositStatus.APPROVAL_TX_PENDING,
        })
      })

      emitter.on('approve-transaction-succeeded', function (receipt) {
        updateNativeBalanceAfterFees(receipt)
        queryClient.invalidateQueries({ queryKey: allowanceQueryKey })
        updateBitcoinYieldOperation({
          status: BitcoinYieldDepositStatus.APPROVAL_TX_COMPLETED,
        })
      })

      emitter.on('approve-transaction-reverted', function (receipt) {
        updateNativeBalanceAfterFees(receipt)
        updateBitcoinYieldOperation({
          status: BitcoinYieldDepositStatus.APPROVAL_TX_FAILED,
        })
      })

      emitter.on('user-signing-approval-error', function () {
        updateBitcoinYieldOperation({
          status: BitcoinYieldDepositStatus.APPROVAL_TX_FAILED,
        })
      })

      emitter.on('user-signed-deposit', function (transactionHash) {
        updateBitcoinYieldOperation({
          status: BitcoinYieldDepositStatus.DEPOSIT_TX_PENDING,
          transactionHash,
        })
      })

      emitter.on('user-signing-deposit-error', function () {
        updateBitcoinYieldOperation({
          status: BitcoinYieldDepositStatus.DEPOSIT_TX_FAILED,
        })
      })

      emitter.on('deposit-transaction-succeeded', function (receipt) {
        updateBitcoinYieldOperation({
          status: BitcoinYieldDepositStatus.DEPOSIT_TX_CONFIRMED,
        })

        // Update balances
        updateNativeBalanceAfterFees(receipt)

        // Update the user token balance
        queryClient.setQueryData(
          tokenBalanceQueryKey,
          (old: bigint) => old - amount,
        )

        // Update pool deposits (add deposited amount)
        queryClient.setQueryData(
          poolDepositsQueryKey,
          (old: bigint) => old + amount,
        )

        // Update user pool balance (add deposited amount to assets
        // converted from vault shares)
        queryClient.setQueryData(
          userPoolBalanceQueryKey,
          (old: bigint) => old + amount,
        )
      })

      emitter.on('deposit-transaction-reverted', function (receipt) {
        updateBitcoinYieldOperation({
          status: BitcoinYieldDepositStatus.DEPOSIT_TX_FAILED,
        })

        // Although the transaction was reverted, the gas was paid.
        updateNativeBalanceAfterFees(receipt)
      })

      emitter.on('deposit-failed-validation', function () {
        updateBitcoinYieldOperation({
          status: BitcoinYieldDepositStatus.DEPOSIT_TX_FAILED,
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
