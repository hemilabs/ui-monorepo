import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { useUpdateNativeBalanceAfterReceipt } from '@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import {
  type RequestDepositEvents,
  getHemiEarnRouterAddress,
} from 'hemi-earn-actions'
import { requestDeposit } from 'hemi-earn-actions/actions'
import { getTokenBalanceQueryKey } from 'hooks/useBalance'
import { buildAllowanceQueryKey } from 'utils/allowanceQueryKey'
import { maxBigInt } from 'utils/bigint'
import { unixNowTimestamp } from 'utils/time'
import { parseTokenUnits } from 'utils/token'
import { type Hash } from 'viem'
import { useAccount, useConfig } from 'wagmi'
import { getWalletClient } from 'wagmi/actions'

import { earnTransactionsKeyPrefix } from '../../../_fetchers/fetchEarnTransactions'
import { useLocalEarnOperations } from '../../../_hooks/useLocalEarnOperations'
import { type EarnAsset, type EarnPool } from '../../../types'
import { type DepositOperation, DepositStatus } from '../_types/operations'

type UseDeposit = {
  callbackFee: bigint
  input: string
  on?: (emitter: EventEmitter<RequestDepositEvents>) => void
  pool: EarnPool
  // Retry callers pass the prior approval hash (allowance still on-chain, so no new
  // user-signed-approval); carried into the new entry so the drawer keeps the approval step.
  priorApprovalTxHash?: Hash
  selectedAsset: EarnAsset
  sharesOutMin: bigint
  // Retry callers pass the FAILED attempt's initiateTxHash; once the new deposit is signed,
  // that exact entry is flagged settled so the old failure doesn't show beside the new attempt.
  supersedesInitiateTxHash?: Hash
  updateDepositOperation?: (payload?: DepositOperation) => void
}

export const useDeposit = function ({
  callbackFee,
  input,
  on,
  pool,
  priorApprovalTxHash,
  selectedAsset,
  sharesOutMin,
  supersedesInitiateTxHash,
  updateDepositOperation,
}: UseDeposit) {
  const amount = parseTokenUnits(input, selectedAsset.token)
  const chainId = selectedAsset.token.chainId
  const routerAddress = getHemiEarnRouterAddress()

  const { address } = useAccount()
  const config = useConfig()
  const ensureConnectedTo = useEnsureConnectedTo()
  const queryClient = useQueryClient()
  const { markSettledByInitiateTxHash, upsertLocalOperation } =
    useLocalEarnOperations()

  const tokenBalanceQueryKey = getTokenBalanceQueryKey({
    account: address,
    chainId,
    tokenAddress: selectedAsset.address,
  })

  const { queryKey: nativeTokenBalanceQueryKey } = useNativeBalance(chainId)

  const updateNativeBalanceAfterFees =
    useUpdateNativeBalanceAfterReceipt(chainId)

  const allowanceQueryKey = buildAllowanceQueryKey({
    chainId,
    owner: address,
    spender: routerAddress,
    tokenAddress: selectedAsset.address,
  })

  return useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error('No account connected')
      }

      await ensureConnectedTo(chainId)

      const walletClient = await getWalletClient(config, { chainId })

      // Local entries are created at two points: user-signed-approval (captures approvalTxHash,
      // which the indexer can't link) and user-signed-deposit (adds initiateTxHash, the merge dedupe key).
      const startedAt = Number(unixNowTimestamp())
      const baseLocalPayload = {
        account: address,
        amountIn: amount.toString(),
        asset: selectedAsset.address,
        chainId,
        kind: 'DEPOSIT' as const,
        operator: address,
        shareAddress: pool.shareAddress,
        startedAt,
      }

      // Approval hash for this attempt; seeded from priorApprovalTxHash for retries, overwritten if a fresh approval is signed.
      let observedApprovalTxHash: Hash | undefined = priorApprovalTxHash

      const { emitter, promise } = requestDeposit({
        account: address,
        amount,
        asset: selectedAsset.address,
        callbackFee,
        operator: address,
        receiver: address,
        routerAddress,
        sharesOutMin,
        walletClient,
      })

      emitter.on('user-signed-approval', function (approvalTxHash) {
        observedApprovalTxHash = approvalTxHash
        updateDepositOperation?.({
          amountIn: amount.toString(),
          approvalTxHash,
          status: DepositStatus.APPROVAL_TX_PENDING,
          transactionHash: undefined,
        })
        // Persist so the drawer can show the approval step across routes (the indexer never links it).
        upsertLocalOperation({
          ...baseLocalPayload,
          approvalTxHash,
          operation: {
            status: DepositStatus.APPROVAL_TX_PENDING,
          },
        })
      })

      emitter.on('approve-transaction-reverted', function (receipt) {
        updateDepositOperation?.({
          status: DepositStatus.APPROVAL_TX_FAILED,
        })
        updateNativeBalanceAfterFees(receipt)
      })

      emitter.on('approve-transaction-succeeded', function (receipt) {
        updateDepositOperation?.({
          status: DepositStatus.APPROVAL_TX_COMPLETED,
        })
        updateNativeBalanceAfterFees(receipt)
        queryClient.invalidateQueries({ queryKey: allowanceQueryKey })
      })

      emitter.on('user-signing-approval-error', function () {
        updateDepositOperation?.({
          status: DepositStatus.APPROVAL_TX_FAILED,
        })
      })

      emitter.on('user-signed-deposit', function (transactionHash) {
        updateDepositOperation?.({
          amountIn: amount.toString(),
          status: DepositStatus.DEPOSIT_TX_PENDING,
          transactionHash,
        })
        upsertLocalOperation({
          ...baseLocalPayload,
          approvalTxHash: observedApprovalTxHash,
          initiateTxHash: transactionHash,
          operation: {
            status: DepositStatus.DEPOSIT_TX_PENDING,
            transactionHash,
          },
        })
        // Hide the prior FAILED entry — here, not on retry click, so it only disappears once the user actually signs.
        if (supersedesInitiateTxHash) {
          markSettledByInitiateTxHash(supersedesInitiateTxHash)
        }
      })

      emitter.on('deposit-transaction-succeeded', function (receipt) {
        updateDepositOperation?.({
          status: DepositStatus.DEPOSIT_TX_CONFIRMED,
        })
        upsertLocalOperation({
          ...baseLocalPayload,
          initiateTxHash: receipt.transactionHash,
          operation: { status: DepositStatus.DEPOSIT_TX_CONFIRMED },
        })
        updateNativeBalanceAfterFees(receipt)

        // Decrement the wallet balance now — the Router pulled tokens in this tx. Pool TVL/position
        // wait for the cross-chain delivery (reconciled by useEarnTransactions at the terminal status).
        queryClient.setQueryData<bigint>(tokenBalanceQueryKey, old =>
          old === undefined ? old : maxBigInt(old - amount, BigInt(0)),
        )
      })

      emitter.on('deposit-transaction-reverted', function (receipt) {
        updateDepositOperation?.({
          status: DepositStatus.DEPOSIT_TX_FAILED,
        })
        upsertLocalOperation({
          ...baseLocalPayload,
          initiateTxHash: receipt.transactionHash,
          operation: { status: DepositStatus.DEPOSIT_TX_FAILED },
        })
        updateNativeBalanceAfterFees(receipt)
      })

      emitter.on('user-signing-deposit-error', function () {
        updateDepositOperation?.({
          status: DepositStatus.DEPOSIT_TX_FAILED,
        })
        // No initiateTxHash was produced, so there's no row to upsert.
      })

      emitter.on('deposit-failed-validation', function () {
        updateDepositOperation?.({
          status: DepositStatus.DEPOSIT_TX_FAILED,
        })
      })

      emitter.on('quote-failed', function () {
        updateDepositOperation?.({
          status: DepositStatus.DEPOSIT_TX_FAILED,
        })
      })

      emitter.on('deposit-failed', function () {
        updateDepositOperation?.({
          status: DepositStatus.DEPOSIT_TX_FAILED,
        })
        upsertLocalOperation({
          ...baseLocalPayload,
          operation: { status: DepositStatus.DEPOSIT_TX_FAILED },
        })
      })

      emitter.on('unexpected-error', function () {
        updateDepositOperation?.({
          status: DepositStatus.DEPOSIT_TX_FAILED,
        })
      })

      on?.(emitter)

      return promise
    },
    onSettled() {
      // Only invalidate Hemi-side state here; the Vetro-side queries move later, when
      // useEarnTransactions sees the terminal status (cross-chain delivery hasn't happened yet).
      queryClient.invalidateQueries({ queryKey: tokenBalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: allowanceQueryKey })
      queryClient.invalidateQueries({ queryKey: nativeTokenBalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: earnTransactionsKeyPrefix })
    },
  })
}
