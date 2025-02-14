import { MessageDirection } from '@eth-optimism/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { TransactionsInProgressContext } from 'context/transactionsInProgressContext'
import { useEvmDeposits } from 'hooks/useEvmDeposits'
import { useDepositNativeToken } from 'hooks/useL2Bridge'
import { useReloadBalances } from 'hooks/useReloadBalances'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useCallback, useContext, useEffect } from 'react'
import { NativeTokenSpecialAddressOnL2 } from 'tokenList/nativeTokens'
import { type EvmToken } from 'types/token'
import { EvmDepositOperation, EvmDepositStatus } from 'types/tunnel'
import { getEvmBlock } from 'utils/evmApi'
import { isNativeToken } from 'utils/nativeToken'
import { type Hash, parseUnits, zeroAddress } from 'viem'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'

import { useDepositToken } from './useDepositToken'
import { useTunnelOperation } from './useTunnelOperation'

type UseDeposit = {
  canDeposit: boolean
  extendedErc20Approval?: boolean | undefined
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
  const { addTransaction, clearTransactionsInMemory, transactions } =
    useContext(TransactionsInProgressContext)
  const deposits = useEvmDeposits()
  const queryClient = useQueryClient()
  const { addDepositToTunnelHistory, updateDeposit } = useTunnelHistory()
  const { updateTxHash, txHash: currentTxHash } = useTunnelOperation()

  const depositingNative = isNativeToken(fromToken)
  const toDeposit = parseUnits(fromInput, fromToken.decimals).toString()

  const getDeposit = ({
    approvalTxHash,
    status,
    transactionHash,
  }: {
    approvalTxHash?: Hash
    status: EvmDepositStatus
    transactionHash: Hash
  }): EvmDepositOperation => ({
    amount: toDeposit,
    approvalTxHash,
    direction: MessageDirection.L1_TO_L2,
    from: address,
    l1ChainId: fromToken.chainId,
    l1Token: depositingNative ? zeroAddress : fromToken.address,
    l2ChainId: toToken.chainId,
    l2Token: depositingNative ? NativeTokenSpecialAddressOnL2 : toToken.address,
    status,
    // "to" field uses the same address as from, which is user's address
    to: address,
    transactionHash,
  })

  const onUserAcceptingDeposit = function (depositTxHash: Hash) {
    // value may come from different places: If there was a successful approval, it's the hash in memory
    // if not, it could come from the retry tx hash
    // if not defined, then there is no approval
    const approvalTxHash = (transactions[0]?.transactionHash ??
      deposits.find(d => d.transactionHash === currentTxHash)
        ?.approvalTxHash) as Hash | undefined

    const depositToAdd = getDeposit({
      approvalTxHash,
      status: EvmDepositStatus.DEPOSIT_TX_PENDING,
      transactionHash: depositTxHash,
    })

    // add hash to query string
    updateTxHash(depositTxHash, { history: currentTxHash ? 'replace' : 'push' })

    addDepositToTunnelHistory(depositToAdd)
    // Clear, if any, the approval txs in memory
    clearTransactionsInMemory()
  }

  const onApprovalSuccess = function (approvalTxHash: Hash) {
    // save the Approval Transaction hash to the list of transactions in progress
    // so the drawer can be shown until we get our deposit TX hash
    addTransaction(
      getDeposit({
        approvalTxHash,
        status: EvmDepositStatus.APPROVAL_TX_PENDING,
        // until there's a deposit hash, use the approval. After all, this is only in memory
        transactionHash: approvalTxHash,
      }),
    )
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
    onSuccess: onUserAcceptingDeposit,
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
    fromToken,
    onApprovalSuccess,
    onSuccess: onUserAcceptingDeposit,
    toToken,
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

  useEffect(
    function updateDepositStatusAfterFailure() {
      if (!depositReceiptError) {
        return
      }
      const deposit = deposits.find(
        d =>
          d.transactionHash === currentTxHash &&
          d.status === EvmDepositStatus.DEPOSIT_TX_PENDING,
      )
      if (!deposit) {
        return
      }
      clearDepositNativeState()
      clearDepositTokenState()

      updateDeposit(deposit, {
        status: EvmDepositStatus.DEPOSIT_TX_FAILED,
      })
    },
    [
      clearDepositNativeState,
      clearDepositTokenState,
      currentTxHash,
      deposits,
      depositReceiptError,
      updateDeposit,
    ],
  )

  useEffect(
    function updateDepositAfterConfirmation() {
      if (depositReceipt?.status !== 'success') {
        return
      }

      const deposit = deposits.find(
        d =>
          d.transactionHash === depositReceipt.transactionHash &&
          d.l1ChainId === fromToken.chainId &&
          !d.blockNumber,
      )

      if (!deposit) {
        return
      }

      clearDepositNativeState()
      clearDepositTokenState()

      // update here so next iteration of the effect doesn't reach this point
      updateDeposit(deposit, {
        blockNumber: Number(depositReceipt.blockNumber),
        status: EvmDepositStatus.DEPOSIT_TX_CONFIRMED,
      })

      // Handling of this error is needed https://github.com/hemilabs/ui-monorepo/issues/322
      // eslint-disable-next-line promise/catch-or-return
      getEvmBlock(depositReceipt.blockNumber, fromToken.chainId).then(block =>
        updateDeposit(deposit, {
          timestamp: Number(block.timestamp),
        }),
      )
    },
    [
      clearDepositNativeState,
      clearDepositTokenState,
      depositReceipt,
      deposits,
      fromToken.chainId,
      updateDeposit,
    ],
  )

  const handleDeposit = (depositCallback: () => void) =>
    function () {
      if (canDeposit) {
        depositCallback()
      }
    }

  if (depositingNative) {
    return {
      clearDepositState: clearDepositNativeState,
      deposit: handleDeposit(function () {
        clearDepositNativeState()
        depositNativeToken()
      }),
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
    deposit: handleDeposit(function () {
      clearDepositTokenState()
      depositToken()
    }),
    depositError: depositErc20TokenError,
    depositGasFees: depositErc20TokenGasFees,
    depositReceipt,
    depositReceiptError,
    depositTxHash: depositErc20TokenTxHash,
    needsApproval,
  }
}
