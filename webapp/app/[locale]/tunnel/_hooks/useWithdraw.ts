import { MessageDirection, MessageStatus } from '@eth-optimism/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { TunnelHistoryContext } from 'context/tunnelHistoryContext'
import { useWithdrawNativeToken, useWithdrawToken } from 'hooks/useL2Bridge'
import { useReloadBalances } from 'hooks/useReloadBalances'
import { useCallback, useContext } from 'react'
import { NativeTokenSpecialAddressOnL2 } from 'tokenList'
import { type EvmToken } from 'types/token'
import { useQueryParams } from 'ui-common/hooks/useQueryParams'
import { isNativeToken } from 'utils/token'
import { type Chain, parseUnits, Hash, zeroAddress } from 'viem'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'

import { useTunnelOperation } from './useTunnelOperation'

type UseWithdraw = {
  canWithdraw: boolean
  fromInput: string
  fromToken: EvmToken
  l1ChainId: Chain['id']
  toToken: EvmToken
}
export const useWithdraw = function ({
  canWithdraw,
  fromInput,
  fromToken,
  l1ChainId,
  toToken,
}: UseWithdraw) {
  const { addWithdrawalToTunnelHistory } = useContext(TunnelHistoryContext)
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const withdrawingNative = isNativeToken(fromToken)
  const { txHash } = useTunnelOperation()
  const { setQueryParams } = useQueryParams()

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
    setQueryParams({ txHash: hash }, 'push')
    // optimistically add the message status to the cache
    queryClient.setQueryData(
      [MessageDirection.L2_TO_L1, l1ChainId, hash, 'getMessageStatus'],
      MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE,
    )

    addWithdrawalToTunnelHistory({
      amount: toWithdraw,
      data: '0x', // not needed
      direction: MessageDirection.L2_TO_L1,
      from: address,
      l1Token: withdrawingNative ? zeroAddress : toToken.address,
      l2Token: withdrawingNative
        ? NativeTokenSpecialAddressOnL2
        : fromToken.address,
      logIndex: 0, // not needed
      status: MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE,
      // "to" field uses the same address as from, which is user's address
      to: address,
      transactionHash: hash,
    })
  }

  const {
    resetWithdrawNativeToken,
    withdrawNativeTokenMutationKey,
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
    withdrawErc20TokenMutationKey,
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
      queryClient.removeQueries({ queryKey: withdrawNativeTokenMutationKey })
    },
    [queryClient, resetWithdrawNativeToken, withdrawNativeTokenMutationKey],
  )

  const clearWithdrawErc20TokenState = useCallback(
    function () {
      // clear the withdrawal operation hash
      resetWithdrawErc20Token()
      // clear withdrawal receipt state
      queryClient.removeQueries({ queryKey: withdrawErc20TokenMutationKey })
    },
    [queryClient, resetWithdrawErc20Token, withdrawErc20TokenMutationKey],
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
