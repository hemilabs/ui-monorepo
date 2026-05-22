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
import { useNetworkType } from 'hooks/useNetworkType'
import { buildAllowanceQueryKey } from 'utils/allowanceQueryKey'
import { parseTokenUnits } from 'utils/token'
import { useAccount, useConfig } from 'wagmi'
import { getWalletClient } from 'wagmi/actions'

import { earnPositionsKeyPrefix } from '../../../_fetchers/fetchEarnPositions'
import { earnTvlQueryKey } from '../../../_hooks/useEarnTvl'
import { type EarnAsset, type EarnPool } from '../../../types'
import { type DepositOperation, DepositStatus } from '../_types/operations'

import { useDrawerQueryString } from './useDrawerQueryString'
import { getUserPoolBalanceQueryKey } from './useUserPoolBalance'

type UseDeposit = {
  fulfillmentFee: bigint
  input: string
  on?: (emitter: EventEmitter<RequestDepositEvents>) => void
  // Pegged-token amount that `Gateway.previewDeposit(asset, amount)` will
  // mint into the vault, used to bump `totalAssets()` optimistically in its
  // native unit. Computed by the caller (the deposit drawer) alongside the
  // LayerZero quote — see `useQuoteDeposit`. Pass `0n` while the preview is
  // pending; the `onSettled` invalidation reconciles in that case.
  peggedAmount: bigint
  pool: EarnPool
  selectedAsset: EarnAsset
  updateDepositOperation: (payload?: DepositOperation) => void
}

export const useDeposit = function ({
  fulfillmentFee,
  input,
  on,
  peggedAmount,
  pool,
  selectedAsset,
  updateDepositOperation,
}: UseDeposit) {
  const amount = parseTokenUnits(input, selectedAsset.token)
  const chainId = selectedAsset.token.chainId
  const routerAddress = getHemiEarnRouterAddress()

  const { setDrawerQueryString } = useDrawerQueryString()
  const { address } = useAccount()
  const config = useConfig()
  const ensureConnectedTo = useEnsureConnectedTo()
  const queryClient = useQueryClient()
  const [networkType] = useNetworkType()

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

  const userPoolBalanceQueryKey = getUserPoolBalanceQueryKey({
    account: address,
    assetAddress: selectedAsset.address,
    chainId,
    shareAddress: pool.shareAddress,
  })

  const userPoolBalanceQueryKeyPrefix = getUserPoolBalanceQueryKey({
    account: address,
    chainId,
    shareAddress: pool.shareAddress,
  })

  const poolTotalAssetsQueryKey = earnTvlQueryKey({
    networkType,
    shareAddress: pool.shareAddress,
  })

  return useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error('No account connected')
      }

      await ensureConnectedTo(chainId)

      const walletClient = await getWalletClient(config, { chainId })

      const { emitter, promise } = requestDeposit({
        account: address,
        amount,
        asset: selectedAsset.address,
        fulfillmentFee,
        receiver: address,
        routerAddress,
        walletClient,
      })

      emitter.on('user-signed-approval', function (approvalTxHash) {
        updateDepositOperation({
          approvalTxHash,
          status: DepositStatus.APPROVAL_TX_PENDING,
          transactionHash: undefined,
        })
        setDrawerQueryString('depositing')
      })

      emitter.on('approve-transaction-reverted', function (receipt) {
        updateDepositOperation({
          status: DepositStatus.APPROVAL_TX_FAILED,
        })
        updateNativeBalanceAfterFees(receipt)
      })

      emitter.on('approve-transaction-succeeded', function (receipt) {
        updateDepositOperation({
          status: DepositStatus.APPROVAL_TX_COMPLETED,
        })
        updateNativeBalanceAfterFees(receipt)
        queryClient.invalidateQueries({ queryKey: allowanceQueryKey })
      })

      emitter.on('user-signing-approval-error', function () {
        updateDepositOperation({
          status: DepositStatus.APPROVAL_TX_FAILED,
        })
      })

      emitter.on('user-signed-deposit', function (transactionHash) {
        updateDepositOperation({
          status: DepositStatus.DEPOSIT_TX_PENDING,
          transactionHash,
        })
        setDrawerQueryString('depositing')
      })

      emitter.on('deposit-transaction-succeeded', function (receipt) {
        // TODO(phase-3): parse the `DepositRequested` log to capture the
        // requestId so the UI can track the cross-chain fulfillment.
        updateDepositOperation({
          status: DepositStatus.DEPOSIT_TX_CONFIRMED,
        })
        updateNativeBalanceAfterFees(receipt)

        // Optimistic bumps. Invalidation in `onSettled` reconciles, but the
        // chained cross-chain refetches take a beat, so the UI feels stale
        // without these.
        //   - `tokenBalance`: wallet ERC-20 went down by exactly `amount`.
        //   - `poolTotalAssets`: vault `totalAssets()` is in pegged-token
        //     units, so we add `peggedAmount` (pre-fetched via
        //     `previewGatewayDeposit`), not `amount`. If the pegged preview
        //     hasn't resolved yet, `peggedAmount` is `0n` and we skip the
        //     bump — the invalidation still corrects it.
        //   - `userPoolBalance.assetOut`: what the withdraw drawer shows.
        //     Bumped by `amount` (asset units) — close to the round-tripped
        //     value (gateway fees are tiny); invalidation reconciles the
        //     exact figure plus the `shares` field for the selected asset,
        //     and the prefix invalidation covers any other cached assets.
        queryClient.setQueryData<bigint>(
          tokenBalanceQueryKey,
          (old = BigInt(0)) => (old > amount ? old - amount : BigInt(0)),
        )
        if (peggedAmount > BigInt(0)) {
          queryClient.setQueryData<bigint>(
            poolTotalAssetsQueryKey,
            (old = BigInt(0)) => old + peggedAmount,
          )
        }
        queryClient.setQueryData<{ assetOut: bigint; shares: bigint }>(
          userPoolBalanceQueryKey,
          old =>
            old
              ? { ...old, assetOut: old.assetOut + amount }
              : { assetOut: amount, shares: BigInt(0) },
        )
      })

      emitter.on('deposit-transaction-reverted', function (receipt) {
        updateDepositOperation({
          status: DepositStatus.DEPOSIT_TX_FAILED,
        })
        updateNativeBalanceAfterFees(receipt)
      })

      emitter.on('user-signing-deposit-error', function () {
        updateDepositOperation({
          status: DepositStatus.DEPOSIT_TX_FAILED,
        })
      })

      emitter.on('deposit-failed-validation', function () {
        updateDepositOperation({
          status: DepositStatus.DEPOSIT_TX_FAILED,
        })
      })

      emitter.on('quote-failed', function () {
        updateDepositOperation({
          status: DepositStatus.DEPOSIT_TX_FAILED,
        })
      })

      emitter.on('deposit-failed', function () {
        updateDepositOperation({
          status: DepositStatus.DEPOSIT_TX_FAILED,
        })
      })

      emitter.on('unexpected-error', function () {
        updateDepositOperation({
          status: DepositStatus.DEPOSIT_TX_FAILED,
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
        queryKey: poolTotalAssetsQueryKey,
      })
      queryClient.invalidateQueries({
        queryKey: userPoolBalanceQueryKeyPrefix,
      })
      queryClient.invalidateQueries({
        queryKey: earnPositionsKeyPrefix,
      })
    },
  })
}
