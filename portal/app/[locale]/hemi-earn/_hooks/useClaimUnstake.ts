import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { useUpdateNativeBalanceAfterReceipt } from '@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type EventEmitter } from 'events'
import { type ClaimUnstakeEvents } from 'hemi-earn-actions'
import {
  claimUnstake,
  getUnstakeRequest,
  quoteRedeemFulfillment,
} from 'hemi-earn-actions/actions'
import { mainnet } from 'networks/mainnet'
import { maxBigInt } from 'utils/bigint'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { isAddressEqual, zeroAddress } from 'viem'
import { useAccount, useWalletClient } from 'wagmi'

import { earnTransactionsKeyPrefix } from '../_fetchers/fetchEarnTransactions'
import { type EarnTransaction } from '../types'

import { agentAddressQueryOptions } from './useHemiEarnAgentAddress'
import { useLocalEarnOperations } from './useLocalEarnOperations'

type UseClaimUnstake = {
  on?: (emitter: EventEmitter<ClaimUnstakeEvents>) => void
  transaction: EarnTransaction
}

export const useClaimUnstake = function ({ on, transaction }: UseClaimUnstake) {
  const { address } = useAccount()
  const ensureConnectedTo = useEnsureConnectedTo()
  const queryClient = useQueryClient()
  const { setSettlement } = useLocalEarnOperations()
  const { data: l1WalletClient } = useWalletClient({ chainId: mainnet.id })
  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    mainnet.id,
  )
  const { queryKey: nativeTokenBalanceQueryKey } = useNativeBalance(mainnet.id)

  const { requestId, requestTxHash } = transaction

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

      const unstakeRequest = await getUnstakeRequest({
        agentAddress,
        client,
        requestId: id,
      })
      if (isAddressEqual(unstakeRequest.share, zeroAddress)) {
        return queryClient.invalidateQueries({
          queryKey: earnTransactionsKeyPrefix,
        })
      }

      const quote = await quoteRedeemFulfillment({
        agentAddress,
        asset: unstakeRequest.asset,
        client,
      })
      const nativeFee = maxBigInt(BigInt(0), quote - unstakeRequest.nativeFee)

      await ensureConnectedTo(mainnet.id)

      const { emitter, promise } = claimUnstake({
        account: address,
        agentAddress,
        nativeFee,
        requestId: id,
        walletClient: l1WalletClient!,
      })

      const fail = () =>
        setSettlement(requestTxHash, { failed: true, kind: 'UNSTAKE' })

      emitter.on('user-signed-tx', function (txHash) {
        setSettlement(requestTxHash, { failed: false, kind: 'UNSTAKE', txHash })
      })
      emitter.on('tx-transaction-succeeded', function (receipt) {
        updateNativeBalanceAfterFees(receipt)
      })
      emitter.on('tx-transaction-reverted', async function (receipt) {
        updateNativeBalanceAfterFees(receipt)

        const current = await getUnstakeRequest({
          agentAddress,
          client,
          requestId: id,
        }).catch(() => undefined)
        if (!current || !isAddressEqual(current.share, zeroAddress)) {
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
    },
  })
}
