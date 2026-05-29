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
import { useTokenBalance } from 'hooks/useBalance'
import { buildAllowanceQueryKey } from 'utils/allowanceQueryKey'
import { parseTokenUnits } from 'utils/token'
import { type Hash } from 'viem'
import { useAccount, useConfig } from 'wagmi'
import { getWalletClient } from 'wagmi/actions'

import { earnTransactionsKeyPrefix } from '../../../_fetchers/fetchEarnTransactions'
import { useLocalEarnOperations } from '../../../_hooks/useLocalEarnOperations'
import { type EarnAsset, type EarnPool } from '../../../types'
import { type DepositOperation, DepositStatus } from '../_types/operations'

type UseDeposit = {
  fulfillmentFee: bigint
  input: string
  on?: (emitter: EventEmitter<RequestDepositEvents>) => void
  pool: EarnPool
  selectedAsset: EarnAsset
  // Set by retry callers: the `initiateTxHash` of the specific prior FAILED
  // attempt being replaced. Once the new deposit is signed, that entry is
  // flagged `settled` so the table doesn't show the old failure alongside
  // the new attempt. Only the exact hash is touched — no broader filtering.
  supersedesInitiateTxHash?: Hash
  updateDepositOperation?: (payload?: DepositOperation) => void
}

export const useDeposit = function ({
  fulfillmentFee,
  input,
  on,
  pool,
  selectedAsset,
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
  // Requires <LocalEarnOperationsProvider> upstream (mounted in the
  // hemi-earn layout). Hook throws at runtime if used outside it.
  const { markSettledByInitiateTxHash, upsertLocalOperation } =
    useLocalEarnOperations()

  const { queryKey: tokenBalanceQueryKey } = useTokenBalance(
    chainId,
    selectedAsset.address,
  )

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

      // Local-store entries are only created once the user signs the deposit
      // tx (where we have an `initiateTxHash`). Approval events stay in the
      // pool-form context but don't get persisted — the home drawer is
      // read-only and doesn't show approval steps.
      const startedAt = Math.floor(Date.now() / 1000)
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

      const { emitter, promise } = requestDeposit({
        account: address,
        amount,
        asset: selectedAsset.address,
        fulfillmentFee,
        operator: address,
        receiver: address,
        routerAddress,
        walletClient,
      })

      emitter.on('user-signed-approval', function (approvalTxHash) {
        updateDepositOperation?.({
          approvalTxHash,
          status: DepositStatus.APPROVAL_TX_PENDING,
          transactionHash: undefined,
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
          status: DepositStatus.DEPOSIT_TX_PENDING,
          transactionHash,
        })
        upsertLocalOperation({
          ...baseLocalPayload,
          initiateTxHash: transactionHash,
          operation: {
            status: DepositStatus.DEPOSIT_TX_PENDING,
            transactionHash,
          },
        })
        // Hide the specific prior FAILED entry the user is replacing. Done
        // here (and not on retry click) so the row only disappears once the
        // user actually commits to the new attempt by signing.
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
          operation: { status: DepositStatus.DEPOSIT_TX_CONFIRMED },
        })
        updateNativeBalanceAfterFees(receipt)

        // Decrement wallet ERC-20 immediately — Router pulled the tokens in
        // this same tx. Pool TVL and user position aren't touched here: those
        // only move after the cross-chain delivery (1–3 min). The CLAIMED /
        // RECOVERED reconcile in `useEarnTransactions` invalidates them when
        // the subgraph reports the terminal state.
        queryClient.setQueryData<bigint>(
          tokenBalanceQueryKey,
          (old = BigInt(0)) => (old > amount ? old - amount : BigInt(0)),
        )
      })

      emitter.on('deposit-transaction-reverted', function (receipt) {
        updateDepositOperation?.({
          status: DepositStatus.DEPOSIT_TX_FAILED,
        })
        upsertLocalOperation({
          ...baseLocalPayload,
          operation: { status: DepositStatus.DEPOSIT_TX_FAILED },
        })
        updateNativeBalanceAfterFees(receipt)
      })

      emitter.on('user-signing-deposit-error', function () {
        updateDepositOperation?.({
          status: DepositStatus.DEPOSIT_TX_FAILED,
        })
        // No local upsert — no `initiateTxHash` was produced, so this never
        // had a table row to update.
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
      // Only invalidate queries that reflect Hemi-side state right now. The
      // Vetro-side queries (pool TVL, user pool balance, staked-balance card)
      // are invalidated by `useEarnTransactions` when the subgraph reports
      // CLAIMED / RECOVERED, since cross-chain delivery hasn't happened yet
      // at this point in the mutation lifecycle.
      queryClient.invalidateQueries({ queryKey: tokenBalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: allowanceQueryKey })
      queryClient.invalidateQueries({ queryKey: nativeTokenBalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: earnTransactionsKeyPrefix })
    },
  })
}
