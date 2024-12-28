import { MessageDirection } from '@eth-optimism/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTunnelOperation } from 'app/[locale]/tunnel/_hooks/useTunnelOperation'
import { BtcChain } from 'btc-wallet/chains'
import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { Satoshis } from 'btc-wallet/unisat'
import { useCallback, useEffect } from 'react'
import {
  BtcDepositOperation,
  BtcDepositStatus,
  BtcWithdrawStatus,
} from 'types/tunnel'
import { getBitcoinTimestamp } from 'utils/bitcoin'
import { getEvmBlock } from 'utils/evmApi'
import {
  claimBtcDeposit,
  initiateBtcDeposit,
  initiateBtcWithdrawal,
} from 'utils/hemi'
import { getNativeToken } from 'utils/token'
import { Chain, zeroAddress, type Address } from 'viem'
import {
  useAccount as useEvmAccount,
  useWaitForTransactionReceipt as useWaitForEvmTransactionReceipt,
} from 'wagmi'

import { useBitcoin } from './useBitcoin'
import { useBtcDeposits } from './useBtcDeposits'
import { useBtcWithdrawals } from './useBtcWithdrawals'
import { useHemiClient, useHemiWalletClient } from './useHemiClient'
import { useTunnelHistory } from './useTunnelHistory'
import { useWaitForTransactionReceipt as useWaitForBtcTransactionReceipt } from './useWaitForTransactionReceipt'

export const useClaimBitcoinDeposit = function (deposit: BtcDepositOperation) {
  const { address } = useEvmAccount()
  const hemiClient = useHemiClient()
  const queryClient = useQueryClient()
  const { hemiWalletClient } = useHemiWalletClient()
  const { updateDeposit } = useTunnelHistory()

  const {
    error: claimBitcoinDepositError,
    reset: resetClaimBitcoinDeposit,
    mutate: confirmBtcDeposit,
    data: claimBitcoinDepositTxHash,
  } = useMutation({
    mutationFn: () =>
      claimBtcDeposit({
        deposit,
        from: address,
        hemiClient,
        hemiWalletClient,
      }),
    mutationKey: [hemiClient, hemiWalletClient],
    onSuccess: claimTransactionHash =>
      updateDeposit(deposit, { claimTransactionHash }),
  })

  const {
    data: claimBitcoinDepositReceipt,
    error: claimBitcoinDepositReceiptError,
    queryKey: claimBitcoinDepositQueryKey,
  } = useWaitForEvmTransactionReceipt({ hash: claimBitcoinDepositTxHash })

  const clearClaimBitcoinDepositState = useCallback(
    function () {
      // reset the claiming state
      resetClaimBitcoinDeposit()
      // clear deposit receipt state
      queryClient.invalidateQueries({ queryKey: claimBitcoinDepositQueryKey })
    },
    [claimBitcoinDepositQueryKey, queryClient, resetClaimBitcoinDeposit],
  )

  useEffect(
    function handleClaimSuccess() {
      if (claimBitcoinDepositReceipt?.status !== 'success') {
        return
      }
      if (deposit.status !== BtcDepositStatus.BTC_READY_CLAIM) {
        return
      }
      updateDeposit(deposit, {
        claimTransactionHash: claimBitcoinDepositReceipt.transactionHash,
        status: BtcDepositStatus.BTC_DEPOSITED,
      })
    },
    [claimBitcoinDepositReceipt, deposit, updateDeposit],
  )

  const handleClaim = function () {
    if (deposit.status !== BtcDepositStatus.BTC_READY_CLAIM) {
      return
    }
    clearClaimBitcoinDepositState()
    // clear any previous transaction hash, which may come from failed attempts
    updateDeposit(deposit, { claimTransactionHash: undefined })
    confirmBtcDeposit()
  }

  return {
    confirmBtcDeposit: handleClaim,
    claimBitcoinDepositError,
    claimBitcoinDepositReceipt,
    claimBitcoinDepositReceiptError,
    claimBitcoinDepositTxHash,
    clearClaimBitcoinDepositState,
  }
}

export const useDepositBitcoin = function () {
  const bitcoin = useBitcoin()
  const { address, connector } = useBtcAccount()
  const deposits = useBtcDeposits()
  const hemiClient = useHemiClient()
  const { addDepositToTunnelHistory, updateDeposit } = useTunnelHistory()
  const { updateTxHash, txHash: currentTxHash } = useTunnelOperation()
  const queryClient = useQueryClient()

  const {
    error: depositError,
    reset: resetSendBitcoin,
    mutate: depositBitcoin,
    data: depositResponse,
  } = useMutation({
    mutationFn: ({
      hemiAddress,
      satoshis,
    }: {
      hemiAddress: Address
      satoshis: Satoshis
    } & Pick<BtcDepositOperation, 'l1ChainId' | 'l2ChainId'>) =>
      initiateBtcDeposit({
        hemiAddress,
        hemiClient,
        satoshis,
        walletConnector: connector,
      }),
    mutationKey: [connector, hemiClient],
    onSuccess(
      { bitcoinCustodyAddress, txHash },
      { l1ChainId, l2ChainId, satoshis },
    ) {
      const btc = getNativeToken(bitcoin.id)
      addDepositToTunnelHistory({
        amount: satoshis.toString(),
        direction: MessageDirection.L1_TO_L2,
        from: address,
        l1ChainId,
        l1Token: btc.address,
        l2ChainId,
        l2Token: btc.extensions.bridgeInfo[l2ChainId].tokenAddress,
        status: BtcDepositStatus.TX_PENDING,
        to: bitcoinCustodyAddress,
        transactionHash: txHash,
      })
      updateTxHash(txHash, { history: 'push' })
    },
  })

  const txId = depositResponse?.txHash

  const {
    data: depositReceipt,
    error: depositReceiptError,
    queryKey: depositQueryKey,
  } = useWaitForBtcTransactionReceipt({ txId })

  const clearDepositState = useCallback(
    function () {
      // reset the sendBitcoin state
      resetSendBitcoin()
      // clear deposit receipt state
      queryClient.invalidateQueries({ queryKey: depositQueryKey })
    },
    [depositQueryKey, queryClient, resetSendBitcoin],
  )

  useEffect(
    function updateDepositStatusAfterFailure() {
      if (!depositReceiptError) {
        return
      }

      const deposit = deposits.find(
        d =>
          d.transactionHash === currentTxHash &&
          d.status === BtcDepositStatus.TX_PENDING,
      )
      if (!deposit) {
        return
      }

      clearDepositState()

      updateDeposit(deposit, {
        status: BtcDepositStatus.DEPOSIT_TX_FAILED,
      })
    },
    [
      clearDepositState,
      currentTxHash,
      depositReceiptError,
      deposits,
      updateDeposit,
    ],
  )

  useEffect(
    function updateDepositAfterConfirmation() {
      if (!depositReceipt?.status.confirmed) {
        return
      }

      const deposit = deposits.find(
        d =>
          d.transactionHash === depositReceipt.txId &&
          d.l1ChainId === bitcoin.id &&
          !d.blockNumber,
      )

      if (!deposit) {
        return
      }

      updateDeposit(deposit, {
        blockNumber: depositReceipt.status.blockHeight,
        status: BtcDepositStatus.TX_CONFIRMED,
        timestamp: getBitcoinTimestamp(depositReceipt.status.blockTime),
      })
    },
    [bitcoin, depositReceipt, deposits, updateDeposit],
  )

  return {
    clearDepositState,
    depositBitcoin,
    depositError,
    depositReceipt,
    depositReceiptError,
    depositTxId: txId,
  }
}

export const useWithdrawBitcoin = function () {
  const bitcoin = useBitcoin()
  const { address: btcAddress } = useBtcAccount()
  const { address: hemiAddress } = useEvmAccount()
  const hemiClient = useHemiClient()
  const { hemiWalletClient } = useHemiWalletClient()
  const { addWithdrawalToTunnelHistory, updateWithdrawal } = useTunnelHistory()
  const { txHash, updateTxHash } = useTunnelOperation()
  const queryClient = useQueryClient()
  const withdrawals = useBtcWithdrawals()

  const {
    error: withdrawError,
    reset: resetWithdrawBitcoin,
    mutate: withdrawBitcoin,
    data: withdrawTxHash,
  } = useMutation({
    mutationFn: ({
      amount,
    }: {
      amount: bigint
      l1ChainId: BtcChain['id']
      l2ChainId: Chain['id']
    }) =>
      initiateBtcWithdrawal({
        amount,
        btcAddress,
        from: hemiAddress,
        hemiClient,
        hemiWalletClient,
      }),
    onSuccess(transactionHash, { amount, l1ChainId, l2ChainId }) {
      addWithdrawalToTunnelHistory({
        amount: amount.toString(),
        direction: MessageDirection.L2_TO_L1,
        from: hemiAddress,
        l1ChainId,
        l1Token: zeroAddress,
        l2ChainId,
        l2Token: getNativeToken(bitcoin.id).extensions.bridgeInfo[
          hemiClient.chain.id
        ].tokenAddress,
        status: BtcWithdrawStatus.TX_PENDING,
        to: btcAddress,
        transactionHash,
      })
      updateTxHash(transactionHash, { history: 'push' })
    },
  })

  const {
    data: withdrawBitcoinReceipt,
    error: withdrawBitcoinReceiptError,
    queryKey: withdrawBitcoinQueryKey,
  } = useWaitForEvmTransactionReceipt({ hash: withdrawTxHash })

  const clearWithdrawBitcoinState = useCallback(
    function () {
      // reset the withdrawing state
      resetWithdrawBitcoin()
      // clear withdraw receipt state
      queryClient.invalidateQueries({ queryKey: withdrawBitcoinQueryKey })
    },
    [queryClient, resetWithdrawBitcoin, withdrawBitcoinQueryKey],
  )

  useEffect(
    function updateWithdrawalStatusAfterFailure() {
      if (!withdrawBitcoinReceiptError) {
        return
      }
      const withdrawal = withdrawals.find(
        w =>
          w.transactionHash === txHash &&
          w.status === BtcWithdrawStatus.TX_PENDING,
      )
      if (!withdrawal) {
        return
      }
      updateWithdrawal(withdrawal, {
        status: BtcWithdrawStatus.WITHDRAWAL_FAILED,
      })
    },
    [txHash, updateWithdrawal, withdrawals, withdrawBitcoinReceiptError],
  )

  useEffect(
    function updateWithdrawalStatusAfterConfirmation() {
      if (withdrawBitcoinReceipt?.status !== 'success') {
        return
      }

      const withdrawal = withdrawals.find(
        w =>
          w.transactionHash === withdrawBitcoinReceipt.transactionHash &&
          !w.blockNumber,
      )

      if (!withdrawal) {
        return
      }

      // update here so next iteration of the effect doesn't reach this point
      updateWithdrawal(withdrawal, {
        blockNumber: Number(withdrawBitcoinReceipt.blockNumber),
        status: BtcWithdrawStatus.TX_CONFIRMED,
      })

      clearWithdrawBitcoinState()

      // Handling of this error is needed https://github.com/hemilabs/ui-monorepo/issues/322
      // eslint-disable-next-line promise/catch-or-return
      getEvmBlock(
        withdrawBitcoinReceipt.blockNumber,
        withdrawal.l2ChainId,
      ).then(block =>
        updateWithdrawal(withdrawal, {
          timestamp: Number(block.timestamp),
        }),
      )
    },
    [
      clearWithdrawBitcoinState,
      updateWithdrawal,
      withdrawals,
      withdrawBitcoinReceipt,
    ],
  )

  return {
    clearWithdrawBitcoinState,
    withdrawBitcoin,
    withdrawBitcoinReceipt,
    withdrawBitcoinReceiptError,
    withdrawError,
    withdrawTxHash,
  }
}
