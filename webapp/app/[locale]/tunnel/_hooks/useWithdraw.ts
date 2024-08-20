import { MessageDirection, MessageStatus } from '@eth-optimism/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { useWithdrawNativeToken, useWithdrawToken } from 'hooks/useL2Bridge'
import { useReloadBalances } from 'hooks/useReloadBalances'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useCallback } from 'react'
import { NativeTokenSpecialAddressOnL2 } from 'tokenList'
import { type EvmToken } from 'types/token'
import { isNativeToken } from 'utils/token'
import { type Chain, parseUnits, Hash, zeroAddress } from 'viem'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'

import { useTunnelOperation } from './useTunnelOperation'

type UseWithdraw = {
  canWithdraw: boolean
  fromInput: string
  fromToken: EvmToken
  l1ChainId: Chain['id']
  l2ChainId: Chain['id']
  toToken: EvmToken
}
export const useWithdraw = function ({
  canWithdraw,
  fromInput,
  fromToken,
  l1ChainId,
  l2ChainId,
  toToken,
}: UseWithdraw) {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const { addWithdrawalToTunnelHistory } = useTunnelHistory()
  const { txHash, updateTxHash } = useTunnelOperation()

  const withdrawingNative = isNativeToken(fromToken)

  const toWithdraw = parseUnits(fromInput, fromToken.decimals).toString()

  const onSettled = (hash: Hash) =>
    // revalidate message status
    queryClient.invalidateQueries({
      queryKey: [
        MessageDirection.L2_TO_L1,
        l1ChainId,
        hash,
        'getMessageStatus',
      ],
    })

  const onSuccess = function (hash: Hash) {
    // add hash to query string
    updateTxHash(hash, { history: 'push' })
    // optimistically add the message status to the cache
    queryClient.setQueryData(
      [MessageDirection.L2_TO_L1, l1ChainId, hash, 'getMessageStatus'],
      MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE,
    )

    addWithdrawalToTunnelHistory({
      amount: toWithdraw,
      direction: MessageDirection.L2_TO_L1,
      from: address,
      l1ChainId,
      l1Token: withdrawingNative ? zeroAddress : toToken.address,
      l2ChainId,
      l2Token: withdrawingNative
        ? NativeTokenSpecialAddressOnL2
        : fromToken.address,
      status: MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE,
      // "to" field uses the same address as from, which is user's address
      to: address,
      transactionHash: hash,
    })
  }

  const {
    resetWithdrawNativeToken,
    withdrawNativeToken,
    withdrawNativeTokenError,
    withdrawNativeTokenGasFees,
  } = useWithdrawNativeToken({
    amount: toWithdraw,
    enabled: withdrawingNative && canWithdraw,
    l1ChainId,
    onSettled,
    onSuccess,
  })

  const {
    resetWithdrawErc20Token,
    withdrawErc20TokenError,
    withdrawErc20TokenGasFees,
    withdrawErc20Token,
  } = useWithdrawToken({
    amount: toWithdraw,
    enabled: !withdrawingNative && canWithdraw,
    l1ChainId,
    onSettled,
    onSuccess,
    token: fromToken,
  })

  const {
    data: withdrawReceipt,
    error: withdrawReceiptError,
    queryKey: withdrawQueryKey,
    status: withdrawTxStatus,
    // @ts-expect-error string is `0x${string}`
  } = useWaitForTransactionReceipt({ hash: txHash })
  useReloadBalances({
    fromToken,
    status: withdrawTxStatus,
    toToken,
  })

  const handleWithdraw = (withdrawCallback: () => void) =>
    function () {
      if (canWithdraw) {
        withdrawCallback()
      }
    }

  const clearWithdrawNativeState = useCallback(
    function () {
      // clear the withdrawal operation hash
      resetWithdrawNativeToken()
      // clear withdrawal receipt state
      queryClient.removeQueries({ queryKey: withdrawQueryKey })
    },
    [queryClient, resetWithdrawNativeToken, withdrawQueryKey],
  )

  const clearWithdrawErc20TokenState = useCallback(
    function () {
      // clear the withdrawal operation hash
      resetWithdrawErc20Token()
      // clear withdrawal receipt state
      queryClient.removeQueries({ queryKey: withdrawQueryKey })
    },
    [queryClient, resetWithdrawErc20Token, withdrawQueryKey],
  )

  if (withdrawingNative) {
    return {
      clearWithdrawState: clearWithdrawNativeState,
      withdraw: handleWithdraw(withdrawNativeToken),
      withdrawError: withdrawNativeTokenError,
      withdrawGasFees: withdrawNativeTokenGasFees,
      withdrawReceipt,
      withdrawReceiptError,
      withdrawStatus: withdrawTxStatus,
    }
  }
  return {
    clearWithdrawState: clearWithdrawErc20TokenState,
    withdraw: handleWithdraw(withdrawErc20Token),
    withdrawError: withdrawErc20TokenError,
    withdrawGasFees: withdrawErc20TokenGasFees,
    withdrawReceipt,
    withdrawReceiptError,
    withdrawStatus: withdrawTxStatus,
  }
}
