import { MessageDirection } from '@eth-optimism/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { TransactionsInProgressContext } from 'context/transactionsInProgressContext'
import { useDepositNativeToken } from 'hooks/useL2Bridge'
import { useReloadBalances } from 'hooks/useReloadBalances'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useCallback, useContext } from 'react'
import { NativeTokenSpecialAddressOnL2 } from 'tokenList'
import { type EvmToken } from 'types/token'
import { DepositTunnelOperation } from 'types/tunnel'
import { isNativeToken } from 'utils/token'
import { type Hash, parseUnits, zeroAddress } from 'viem'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'

import { useDepositToken } from './useDepositToken'
import { useTunnelOperation } from './useTunnelOperation'

type UseDeposit = {
  canDeposit: boolean
  extendedErc20Approval: boolean | undefined
  fromInput: string
  fromToken: EvmToken
  toToken: EvmToken
}
export const useDeposit = function ({
  canDeposit,
  extendedErc20Approval,
  fromInput,
  fromToken,
  toToken,
}: UseDeposit) {
  const { address } = useAccount()
  const { addTransaction, clearTransactionsInMemory } = useContext(
    TransactionsInProgressContext,
  )
  const queryClient = useQueryClient()
  const { addDepositToTunnelHistory } = useTunnelHistory()
  const { updateTxHash } = useTunnelOperation()

  const depositingNative = isNativeToken(fromToken)
  const toDeposit = parseUnits(fromInput, fromToken.decimals).toString()

  const getDeposit = (hash: Hash): DepositTunnelOperation => ({
    amount: toDeposit,
    direction: MessageDirection.L1_TO_L2,
    from: address,
    l1ChainId: fromToken.chainId,
    l1Token: depositingNative ? zeroAddress : fromToken.address,
    l2ChainId: toToken.chainId,
    l2Token: depositingNative ? NativeTokenSpecialAddressOnL2 : toToken.address,
    // "to" field uses the same address as from, which is user's address
    to: address,
    transactionHash: hash,
  })

  const onSuccess = function (hash: Hash) {
    // add hash to query string
    updateTxHash(hash)

    addDepositToTunnelHistory(getDeposit(hash))
    // Clear, if any, the approval txs in memory
    clearTransactionsInMemory()
  }

  const onApprovalSuccess = function (approvalTxHash: Hash) {
    // save the Approval Transaction hash to the list of transactions in progress
    // so the drawer can be shown until we get our deposit TX hash
    addTransaction(getDeposit(approvalTxHash))
    // and now, add that hash to the url. It will be used until the Deposit hash is generated
    updateTxHash(approvalTxHash, { history: 'push' })
  }

  const {
    depositNativeToken,
    depositNativeTokenError,
    depositNativeTokenGasFees,
    depositNativeTokenTxHash,
    resetDepositNativeToken,
  } = useDepositNativeToken({
    enabled: depositingNative && canDeposit,
    l1ChainId: fromToken.chainId,
    onSuccess,
    toDeposit,
  })

  const {
    approvalError,
    approvalQueryKey,
    approvalReceipt,
    approvalReceiptError,
    approvalTokenGasFees,
    approvalTxHash,
    depositErc20TokenError,
    depositErc20TokenGasFees,
    depositErc20TokenTxHash,
    depositToken,
    needsApproval,
    resetApproval,
    resetDepositToken,
  } = useDepositToken({
    amount: fromInput,
    enabled: !depositingNative && canDeposit,
    extendedApproval: extendedErc20Approval,
    onApprovalSuccess,
    onSuccess,
    token: fromToken,
  })

  const {
    data: depositReceipt,
    error: depositReceiptError,
    queryKey: depositQueryKey,
    status: depositTxStatus,
  } = useWaitForTransactionReceipt({
    hash: depositingNative ? depositNativeTokenTxHash : depositErc20TokenTxHash,
  })

  useReloadBalances({
    fromToken,
    status: depositTxStatus,
    toToken,
  })

  const handleDeposit = (depositCallback: () => void) =>
    function () {
      if (canDeposit) {
        depositCallback()
      }
    }

  const clearDepositNativeState = useCallback(
    function () {
      // clear the deposit operation hash
      resetDepositNativeToken()
      // clear transaction receipt state
      queryClient.removeQueries({ queryKey: depositQueryKey })
    },
    [depositQueryKey, queryClient, resetDepositNativeToken],
  )

  const clearDepositTokenState = useCallback(
    function () {
      // clear the approval operation hash, if any
      resetApproval?.()
      // clear the deposit operation hash
      resetDepositToken()
      // clear approval receipt state
      queryClient.removeQueries({ queryKey: approvalQueryKey })
      // clear transaction receipt state
      queryClient.removeQueries({ queryKey: depositQueryKey })
    },
    [
      approvalQueryKey,
      depositQueryKey,
      queryClient,
      resetApproval,
      resetDepositToken,
    ],
  )

  if (depositingNative) {
    return {
      clearDepositState: clearDepositNativeState,
      deposit: handleDeposit(depositNativeToken),
      depositError: depositNativeTokenError,
      depositGasFees: depositNativeTokenGasFees,
      depositReceipt,
      depositReceiptError,
      depositTxHash: depositNativeTokenTxHash,
      needsApproval: false,
    }
  }

  return {
    approvalError,
    approvalReceipt,
    approvalReceiptError,
    approvalTokenGasFees,
    approvalTxHash,
    clearDepositState: clearDepositTokenState,
    deposit: handleDeposit(depositToken),
    depositError: depositErc20TokenError,
    depositGasFees: depositErc20TokenGasFees,
    depositReceipt,
    depositReceiptError,
    depositTxHash: depositErc20TokenTxHash,
    needsApproval,
  }
}
