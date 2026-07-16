'use client'

import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { useUpdateNativeBalanceAfterReceipt } from '@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type EventEmitter } from 'events'
import {
  type CancelRequestEvents,
  type RetryRequestEvents,
} from 'hemi-earn-actions'
import {
  cancelRequest,
  getFailedRequest,
  quoteDepositFulfillment,
  quoteRedeemFulfillment,
  retryRequest,
} from 'hemi-earn-actions/actions'
import { mainnet } from 'networks/mainnet'
import { maxBigInt } from 'utils/bigint'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { isAddressEqual, zeroAddress } from 'viem'
import { useAccount, useWalletClient } from 'wagmi'

import { earnTransactionsKeyPrefix } from '../_fetchers/fetchEarnTransactions'
import { type EarnSettlement, type EarnTransaction } from '../types'

import { assetDataQueryOptions } from './useAssetData'
import { getFailedRequestQueryKey } from './useFailedRequest'
import { agentAddressQueryOptions } from './useHemiEarnAgentAddress'
import { useLocalEarnOperations } from './useLocalEarnOperations'

type RemoteFailedKind = Extract<
  EarnSettlement['kind'],
  'RETRY' | 'CANCEL_REQUEST'
>

type UseRemoteFailedAction = {
  action: typeof retryRequest
  kind: RemoteFailedKind
  on?: (emitter: EventEmitter<RetryRequestEvents>) => void
  transaction: EarnTransaction
}

const useRemoteFailedAction = function ({
  action,
  kind,
  on,
  transaction,
}: UseRemoteFailedAction) {
  const { address } = useAccount()
  const ensureConnectedTo = useEnsureConnectedTo()
  const queryClient = useQueryClient()
  const { setSettlement } = useLocalEarnOperations()
  const { data: l1WalletClient } = useWalletClient({
    chainId: mainnet.id,
  })
  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    mainnet.id,
  )
  const { queryKey: nativeTokenBalanceQueryKey } = useNativeBalance(mainnet.id)

  const { asset, requestId, requestTxHash } = transaction

  return useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error('No account connected')
      }

      const agentAddress = await queryClient.ensureQueryData(
        agentAddressQueryOptions(),
      )
      const client = getEvmL1PublicClient(mainnet.id)
      const id = BigInt(requestId)

      const failedRequest = await getFailedRequest({
        agentAddress,
        client,
        requestId: id,
      })
      // Entry already gone — a keeper retried/cancelled first; nothing to sign, just refresh.
      if (isAddressEqual(failedRequest.tokenIn, zeroAddress)) {
        return queryClient.invalidateQueries({
          queryKey: earnTransactionsKeyPrefix,
        })
      }

      const { remoteAsset, remoteShare } = await queryClient.ensureQueryData(
        assetDataQueryOptions(asset),
      )
      // Quote the OFT the action actually sends: retry sends the fulfillment token
      // (deposit → share, redeem → asset), cancel returns tokenIn (deposit → asset,
      // redeem → share). Sizing against the wrong OFT would under/over-fund the top-up.
      const isRetry = kind === 'RETRY'
      const isDeposit = transaction.kind === 'DEPOSIT'
      const usesShareOft = (isDeposit && isRetry) || (!isDeposit && !isRetry)
      const quote = usesShareOft
        ? await quoteDepositFulfillment({
            agentAddress,
            client,
            share: remoteShare,
          })
        : await quoteRedeemFulfillment({
            agentAddress,
            asset: remoteAsset,
            client,
          })
      // retry/cancel run with failedRequest.nativeFee + msg.value on-chain, so only top up the shortfall.
      const nativeFee = maxBigInt(BigInt(0), quote - failedRequest.nativeFee)

      await ensureConnectedTo(mainnet.id)

      const { emitter, promise } = action({
        account: address,
        agentAddress,
        nativeFee,
        requestId: id,
        walletClient: l1WalletClient!,
      })

      const fail = () => setSettlement(requestTxHash, { failed: true, kind })

      emitter.on('user-signed-tx', function (txHash) {
        setSettlement(requestTxHash, { failed: false, kind, txHash })
      })
      emitter.on('tx-transaction-succeeded', function (receipt) {
        updateNativeBalanceAfterFees(receipt)
      })
      emitter.on('tx-transaction-reverted', async function (receipt) {
        updateNativeBalanceAfterFees(receipt)

        const current = await getFailedRequest({
          agentAddress,
          client,
          requestId: id,
        }).catch(() => undefined)
        // Benign revert: the entry is gone, so someone else resolved it — don't flag failed.
        if (!current || !isAddressEqual(current.tokenIn, zeroAddress)) {
          fail()
        }
      })
      emitter.on('tx-failed', fail)
      emitter.on('tx-failed-validation', fail)
      emitter.on('user-signing-tx-error', fail)
      emitter.on('unexpected-error', fail)

      on?.(emitter)

      return promise
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: earnTransactionsKeyPrefix })
      queryClient.invalidateQueries({ queryKey: nativeTokenBalanceQueryKey })
      queryClient.invalidateQueries({
        queryKey: getFailedRequestQueryKey(address, requestId),
      })
    },
  })
}

export const useRetryRequest = ({
  on,
  transaction,
}: {
  on?: (emitter: EventEmitter<RetryRequestEvents>) => void
  transaction: EarnTransaction
}) =>
  useRemoteFailedAction({
    action: retryRequest,
    kind: 'RETRY',
    on,
    transaction,
  })

export const useCancelRequest = ({
  on,
  transaction,
}: {
  on?: (emitter: EventEmitter<CancelRequestEvents>) => void
  transaction: EarnTransaction
}) =>
  useRemoteFailedAction({
    action: cancelRequest,
    kind: 'CANCEL_REQUEST',
    on,
    transaction,
  })
