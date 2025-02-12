import { MessageDirection, MessageStatus } from '@eth-optimism/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { NativeTokenSpecialAddressOnL2 } from 'app/tokenList'
import { useWithdrawNativeToken, useWithdrawToken } from 'hooks/useL2Bridge'
import { useReloadBalances } from 'hooks/useReloadBalances'
import { useToEvmWithdrawals } from 'hooks/useToEvmWithdrawals'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useCallback, useEffect } from 'react'
import { type EvmToken } from 'types/token'
import { getEvmBlock } from 'utils/evmApi'
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
  const { addWithdrawalToTunnelHistory, updateWithdrawal } = useTunnelHistory()
  const withdrawals = useToEvmWithdrawals()
  const { txHash, updateTxHash } = useTunnelOperation()

  const withdrawingNative = isNativeToken(fromToken)

  const toWithdraw = parseUnits(fromInput, fromToken.decimals).toString()

  const onSuccess = function (hash: Hash) {
    // add hash to query string
    updateTxHash(hash, { history: 'push' })

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
    fromToken,
    l1ChainId,
    onSuccess,
    toToken,
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

  useEffect(
    function updateWithdrawalStatusAfterFailure() {
      if (!withdrawReceiptError) {
        return
      }
      const withdrawal = withdrawals.find(
        w =>
          w.transactionHash === txHash &&
          w.status !== MessageStatus.FAILED_L1_TO_L2_MESSAGE,
      )
      if (!withdrawal) {
        return
      }
      updateWithdrawal(withdrawal, {
        status: MessageStatus.FAILED_L1_TO_L2_MESSAGE,
      })
    },
    [txHash, updateWithdrawal, withdrawals, withdrawReceiptError],
  )

  useEffect(
    function updateWithdrawalStatusAfterConfirmation() {
      if (withdrawReceipt?.status !== 'success') {
        return
      }
      const withdrawal = withdrawals.find(
        w =>
          w.transactionHash === withdrawReceipt.transactionHash &&
          !w.blockNumber,
      )

      if (!withdrawal) {
        return
      }

      clearWithdrawErc20TokenState()
      clearWithdrawNativeState()

      // update here so next iteration of the effect doesn't reach this point
      updateWithdrawal(withdrawal, {
        blockNumber: Number(withdrawReceipt.blockNumber),
        status: MessageStatus.STATE_ROOT_NOT_PUBLISHED,
      })

      // Handling of this error is needed https://github.com/hemilabs/ui-monorepo/issues/322
      // eslint-disable-next-line promise/catch-or-return
      getEvmBlock(withdrawReceipt.blockNumber, l2ChainId).then(block =>
        updateWithdrawal(withdrawal, {
          timestamp: Number(block.timestamp),
        }),
      )
    },
    [
      clearWithdrawErc20TokenState,
      clearWithdrawNativeState,
      l2ChainId,
      updateWithdrawal,
      withdrawals,
      withdrawReceipt,
      withdrawReceiptError,
    ],
  )

  const handleWithdraw = (withdrawCallback: () => void) =>
    function () {
      if (canWithdraw) {
        withdrawCallback()
      }
    }

  if (withdrawingNative) {
    return {
      clearWithdrawState: clearWithdrawNativeState,
      withdraw: handleWithdraw(function () {
        clearWithdrawNativeState()
        withdrawNativeToken()
      }),
      withdrawError: withdrawNativeTokenError,
      withdrawGasFees: withdrawNativeTokenGasFees,
      withdrawReceipt,
      withdrawReceiptError,
      withdrawStatus: withdrawTxStatus,
    }
  }
  return {
    clearWithdrawState: clearWithdrawErc20TokenState,
    withdraw: handleWithdraw(function () {
      clearWithdrawErc20TokenState()
      withdrawErc20Token()
    }),
    withdrawError: withdrawErc20TokenError,
    withdrawGasFees: withdrawErc20TokenGasFees,
    withdrawReceipt,
    withdrawReceiptError,
    withdrawStatus: withdrawTxStatus,
  }
}
