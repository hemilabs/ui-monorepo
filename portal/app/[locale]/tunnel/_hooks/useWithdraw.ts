import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useUmami } from 'app/analyticsEvents'
import EventEmitter from 'events'
import { initiateWithdrawErc20, initiateWithdrawEth } from 'hemi-tunnel-actions'
import { WithdrawEvents } from 'hemi-tunnel-actions/src/types'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useHemiClient, useHemiWalletClient } from 'hooks/useHemiClient'
import { useUpdateNativeBalanceAfterReceipt } from 'hooks/useInvalidateNativeBalanceAfterReceipt'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { NativeTokenSpecialAddressOnL2 } from 'tokenList/nativeTokens'
import { type EvmToken } from 'types/token'
import {
  MessageDirection,
  MessageStatus,
  ToEvmWithdrawOperation,
} from 'types/tunnel'
import { findChainById } from 'utils/chain'
import { isNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { type Chain, zeroAddress, Address } from 'viem'
import { useAccount } from 'wagmi'

import { useTunnelOperation } from './useTunnelOperation'

type UseWithdraw = {
  fromInput: string
  fromToken: EvmToken
  on?: (emitter: EventEmitter<WithdrawEvents>) => void
  toToken: EvmToken
}

export const useWithdraw = function ({
  fromInput,
  fromToken,
  on,
  toToken,
}: UseWithdraw) {
  const amount = parseTokenUnits(fromInput, fromToken)

  const { address: account } = useAccount()
  const hemiPublicClient = useHemiClient()
  const { hemiWalletClient } = useHemiWalletClient()
  const { queryKey: nativeTokenBalanceQueryKey } = useNativeTokenBalance(
    fromToken.chainId,
  )
  const [networkType] = useNetworkType()
  const queryClient = useQueryClient()
  const { queryKey: erc20BalanceQueryKey } = useTokenBalance(
    fromToken.chainId,
    fromToken.address,
  )
  const { addWithdrawalToTunnelHistory, updateWithdrawal } = useTunnelHistory()
  const { updateTxHash } = useTunnelOperation()
  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    fromToken.chainId,
  )

  const { track } = useUmami()

  const withdrawingNative = isNativeToken(fromToken)

  return useMutation({
    mutationFn: function runWithdraw() {
      track?.('evm - init withdraw started', { chain: networkType })

      const l2TokenAddress = withdrawingNative
        ? NativeTokenSpecialAddressOnL2
        : (fromToken.address as Address)

      const l1Chain = findChainById(toToken.chainId) as Chain
      const l2Chain = findChainById(fromToken.chainId) as Chain

      const args = {
        account,
        amount,
        l1Chain,
        l2Chain,
        l2PublicClient: hemiPublicClient,
        l2TokenAddress,
        l2WalletClient: hemiWalletClient,
      }

      const { emitter, promise } = withdrawingNative
        ? initiateWithdrawEth(args)
        : initiateWithdrawErc20(args)

      let withdrawal: ToEvmWithdrawOperation | undefined

      emitter.on('user-signed-withdraw', function (transactionHash) {
        withdrawal = {
          amount: amount.toString(),
          direction: MessageDirection.L2_TO_L1,
          from: account,
          l1ChainId: toToken.chainId,
          l1Token: withdrawingNative ? zeroAddress : toToken.address,
          l2ChainId: fromToken.chainId,
          l2Token: l2TokenAddress,
          status: MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE,
          // "to" field uses the same address as from, which is user's address
          to: account,
          transactionHash,
        }
        addWithdrawalToTunnelHistory(withdrawal)
        // add hash to query string
        updateTxHash(transactionHash, { history: 'push' })
      })

      emitter.on('withdraw-transaction-reverted', function (receipt) {
        // regardless, fees were paid
        updateNativeBalanceAfterFees(receipt)
        track?.('evm - init withdraw failed', { chain: networkType })

        updateWithdrawal(withdrawal, {
          blockNumber: Number(receipt.blockNumber),
          status: MessageStatus.FAILED_L1_TO_L2_MESSAGE,
        })
      })

      emitter.on('withdraw-transaction-succeeded', function (receipt) {
        track?.('evm - init withdraw success', { chain: networkType })

        updateNativeBalanceAfterFees(
          receipt,
          withdrawingNative ? amount : undefined,
        )

        // if erc20 was withdrawn, we need to update the balance
        if (!withdrawingNative) {
          queryClient.setQueryData(
            erc20BalanceQueryKey,
            (old: bigint) => old - amount,
          )
        }

        updateWithdrawal(withdrawal, {
          blockNumber: Number(receipt.blockNumber),
          status: MessageStatus.STATE_ROOT_NOT_PUBLISHED,
        })
      })

      on?.(emitter)

      return promise
    },
    onSettled() {
      // Do not return the promises here. Doing so will delay the resolution of
      // the mutation, which will cause the UI to be out of sync until balances are re-validated.
      // Query invalidation here must work as fire and forget, as, after all, it runs in the background!
      if (!withdrawingNative) {
        queryClient.invalidateQueries({ queryKey: erc20BalanceQueryKey })
      }
      // gas was paid in the L2 chain, so we need to invalidate the balance
      queryClient.invalidateQueries({
        queryKey: nativeTokenBalanceQueryKey,
      })
    },
  })
}
