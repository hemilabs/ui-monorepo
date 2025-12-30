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
  MessageDirection,
  ToBtcWithdrawOperation,
} from 'types/tunnel'
import { getBitcoinTimestamp } from 'utils/bitcoin'
import {
  confirmBtcDeposit,
  getBitcoinDepositFee,
  getBitcoinWithdrawalFee,
  getBitcoinWithdrawalUuid,
  initiateBtcDeposit,
  initiateBtcWithdrawal,
} from 'utils/hemi'
import { getNativeToken } from 'utils/nativeToken'
import { type Chain, zeroAddress, type Address } from 'viem'
import {
  useAccount as useEvmAccount,
  useWaitForTransactionReceipt as useWaitForEvmTransactionReceipt,
} from 'wagmi'

import { useBitcoin } from './useBitcoin'
import { useBtcDeposits } from './useBtcDeposits'
import { useBtcWithdrawals } from './useBtcWithdrawals'
import { useEnsureConnectedTo } from './useEnsureConnectedTo'
import { useHemi } from './useHemi'
import { useHemiClient, useHemiWalletClient } from './useHemiClient'
import { useTunnelHistory } from './useTunnelHistory'
import { useWaitForTransactionReceipt as useWaitForBtcTransactionReceipt } from './useWaitForTransactionReceipt'

export const useConfirmBitcoinDeposit = function (
  deposit: BtcDepositOperation,
) {
  const { address } = useEvmAccount()
  const hemiClient = useHemiClient()
  const hemi = useHemi()
  const queryClient = useQueryClient()
  const { hemiWalletClient } = useHemiWalletClient()
  const { updateDeposit } = useTunnelHistory()
  const ensureConnectedTo = useEnsureConnectedTo()

  const {
    data: confirmBitcoinDepositTxHash,
    error: confirmBitcoinDepositError,
    mutate: confirmBitcoinDeposit,
    reset: resetConfirmBitcoinDeposit,
  } = useMutation({
    mutationFn: async function runConfirmBitcoinDeposit() {
      await ensureConnectedTo(hemi.id)

      return confirmBtcDeposit({
        deposit,
        from: address!,
        hemiClient,
        hemiWalletClient,
      })
    },
    mutationKey: [hemiClient, hemiWalletClient],
    onSuccess: confirmationTransactionHash =>
      updateDeposit(deposit, {
        confirmationTransactionHash,
        status: BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMING,
      }),
  })

  const {
    data: confirmBitcoinDepositReceipt,
    error: confirmBitcoinDepositReceiptError,
    queryKey: confirmBitcoinDepositQueryKey,
  } = useWaitForEvmTransactionReceipt({ hash: confirmBitcoinDepositTxHash })

  const clearConfirmBitcoinDepositState = useCallback(
    function () {
      // reset the confirm state
      resetConfirmBitcoinDeposit()
      // clear deposit receipt state
      queryClient.invalidateQueries({ queryKey: confirmBitcoinDepositQueryKey })
    },
    [confirmBitcoinDepositQueryKey, queryClient, resetConfirmBitcoinDeposit],
  )

  useEffect(
    function handleConfirmDepositFailure() {
      if (!confirmBitcoinDepositReceiptError) {
        return
      }
      if (
        deposit.status ===
        BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMATION_TX_FAILED
      ) {
        return
      }
      updateDeposit(deposit, {
        status: BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMATION_TX_FAILED,
      })
    },
    [confirmBitcoinDepositReceiptError, deposit, updateDeposit],
  )

  useEffect(
    function handleConfirmDepositSuccess() {
      if (confirmBitcoinDepositReceipt?.status !== 'success') {
        return
      }
      if (deposit.status === BtcDepositStatus.BTC_DEPOSITED) {
        return
      }
      updateDeposit(deposit, {
        confirmationTransactionHash:
          confirmBitcoinDepositReceipt.transactionHash,
        status: BtcDepositStatus.BTC_DEPOSITED,
      })
    },
    [confirmBitcoinDepositReceipt, deposit, updateDeposit],
  )

  const handleConfirmManually = function () {
    if (deposit.status !== BtcDepositStatus.READY_TO_MANUAL_CONFIRM) {
      return
    }
    clearConfirmBitcoinDepositState()
    // clear any previous transaction hash, which may come from failed attempts
    updateDeposit(deposit, { confirmationTransactionHash: undefined })
    confirmBitcoinDeposit()
  }

  return {
    clearConfirmBitcoinDepositState,
    confirmBitcoinDeposit: handleConfirmManually,
    confirmBitcoinDepositError,
    confirmBitcoinDepositReceipt,
    confirmBitcoinDepositReceiptError,
    confirmBitcoinDepositTxHash,
  }
}

export const useDepositBitcoin = function () {
  const bitcoin = useBitcoin()
  const { address, connector } = useBtcAccount()
  const deposits = useBtcDeposits()
  const hemiClient = useHemiClient()
  const { addDepositToTunnelHistory, updateDeposit } = useTunnelHistory()
  const { txHash: currentTxHash, updateTxHash } = useTunnelOperation()
  const queryClient = useQueryClient()

  const {
    data: depositResponse,
    error: depositError,
    mutate: depositBitcoin,
    reset: resetSendBitcoin,
  } = useMutation({
    async mutationFn({
      hemiAddress,
      satoshis,
    }: {
      hemiAddress: Address
      satoshis: Satoshis
    } & Pick<BtcDepositOperation, 'l1ChainId' | 'l2ChainId'>) {
      const [depositResult, vaultFee] = await Promise.all([
        initiateBtcDeposit({
          hemiAddress,
          hemiClient,
          satoshis,
          walletConnector: connector!,
        }),
        getBitcoinDepositFee({
          amount: BigInt(satoshis),
          hemiClient,
        }).catch(() => BigInt(0)), // Return 0 if fee fetch fails
      ])

      return { ...depositResult, vaultFee }
    },
    mutationKey: [connector, hemiClient],
    onSuccess(
      { bitcoinCustodyAddress, txHash, vaultFee },
      { l1ChainId, l2ChainId, satoshis },
    ) {
      const btc = getNativeToken(bitcoin.id)

      // If vaultFee is 0, it means the fetch failed - use gross amount as fallback
      const amount = (BigInt(satoshis) - vaultFee).toString()

      addDepositToTunnelHistory({
        amount,
        direction: MessageDirection.L1_TO_L2,
        from: address!,
        grossAmount: satoshis.toString(),
        l1ChainId,
        l1Token: btc.address,
        l2ChainId,
        l2Token: btc.extensions!.bridgeInfo![l2ChainId].tokenAddress!,
        status: BtcDepositStatus.BTC_TX_PENDING,
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
          d.status === BtcDepositStatus.BTC_TX_PENDING,
      )
      if (!deposit) {
        return
      }

      clearDepositState()

      updateDeposit(deposit, {
        status: BtcDepositStatus.BTC_TX_FAILED,
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
        status: BtcDepositStatus.BTC_TX_CONFIRMED,
        timestamp: depositReceipt.status.blockTime
          ? getBitcoinTimestamp(depositReceipt.status.blockTime)
          : undefined,
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
  const hemi = useHemi()
  const hemiClient = useHemiClient()
  const { hemiWalletClient } = useHemiWalletClient()
  const { addWithdrawalToTunnelHistory, updateWithdrawal } = useTunnelHistory()
  const { txHash, updateTxHash } = useTunnelOperation()
  const queryClient = useQueryClient()
  const withdrawals = useBtcWithdrawals()
  const ensureConnectedTo = useEnsureConnectedTo()

  const {
    data: withdrawData,
    error: withdrawError,
    mutate: withdrawBitcoin,
    reset: resetWithdrawBitcoin,
  } = useMutation({
    async mutationFn({
      amount,
    }: {
      amount: bigint
      l1ChainId: BtcChain['id']
      l2ChainId: Chain['id']
    }) {
      await ensureConnectedTo(hemi.id)

      const [transactionHash, vaultFee] = await Promise.all([
        initiateBtcWithdrawal({
          amount,
          btcAddress: btcAddress!,
          from: hemiAddress!,
          hemiClient,
          hemiWalletClient,
        }),
        getBitcoinWithdrawalFee({
          amount,
          hemiClient,
        }).catch(() => BigInt(0)), // Return 0 if fee fetch fails
      ])

      return { transactionHash, vaultFee }
    },
    onSuccess({ transactionHash, vaultFee }, { amount, l1ChainId, l2ChainId }) {
      // Calculate net amount after vault fee
      const amountAfterFeesDeduction = (amount - vaultFee).toString()

      addWithdrawalToTunnelHistory({
        amount: amountAfterFeesDeduction,
        direction: MessageDirection.L2_TO_L1,
        from: hemiAddress!,
        grossAmount: amount.toString(),
        l1ChainId,
        l1Token: zeroAddress,
        l2ChainId,
        l2Token: getNativeToken(bitcoin.id)!.extensions!.bridgeInfo![hemi.id]
          .tokenAddress!,
        status: BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING,
        to: btcAddress!,
        transactionHash,
      })
      updateTxHash(transactionHash, { history: 'push' })
    },
  })

  const {
    data: withdrawBitcoinReceipt,
    error: withdrawBitcoinReceiptError,
    queryKey: withdrawBitcoinQueryKey,
  } = useWaitForEvmTransactionReceipt({ hash: withdrawData?.transactionHash })

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
          w.status === BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING,
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

      const uuid = getBitcoinWithdrawalUuid(withdrawBitcoinReceipt)

      // update here so next iteration of the effect doesn't reach this point
      updateWithdrawal(withdrawal, {
        blockNumber: Number(withdrawBitcoinReceipt.blockNumber),
        status: BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED,
        uuid: uuid?.toString(),
      })

      clearWithdrawBitcoinState()

      // If this call fails, the watcher web-workers will retry them
      hemiClient
        .getBlock({ blockNumber: withdrawBitcoinReceipt.blockNumber })
        .then(block =>
          updateWithdrawal(withdrawal, {
            timestamp: Number(block.timestamp),
          }),
        )
        .catch(() => null)
    },
    [
      clearWithdrawBitcoinState,
      hemiClient,
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
    withdrawData,
    withdrawError,
  }
}

export const useChallengeBitcoinWithdrawal = function (
  withdrawal: ToBtcWithdrawOperation,
) {
  const { address: hemiAddress } = useEvmAccount()
  const { hemiWalletClient } = useHemiWalletClient()
  const hemi = useHemi()
  const { updateWithdrawal } = useTunnelHistory()
  const queryClient = useQueryClient()
  const ensureConnectedTo = useEnsureConnectedTo()

  const {
    data: challengeTransactionHash,
    error: challengeError,
    mutate: challengeWithdrawal,
    reset: resetChallengeWithdrawal,
  } = useMutation({
    async mutationFn() {
      await ensureConnectedTo(hemi.id)

      if (!hemiAddress) {
        throw new Error('Not Connected')
      }
      if (!withdrawal.uuid) {
        throw new Error('Withdrawal UUID is required to challenge')
      }

      return hemiWalletClient!.challengeWithdrawal({
        from: hemiAddress,
        uuid: BigInt(withdrawal.uuid),
      })
    },
    onError: () =>
      updateWithdrawal(withdrawal, {
        // Error here means rejection and that the TX wasn't generated
        status: BtcWithdrawStatus.READY_TO_CHALLENGE,
      }),
    onSuccess: challengeTxHash =>
      updateWithdrawal(withdrawal, {
        challengeTxHash,
        status: BtcWithdrawStatus.CHALLENGE_IN_PROGRESS,
      }),
  })

  const {
    data: challengeReceipt,
    error: challengeReceiptError,
    queryKey: challengeQueryKey,
  } = useWaitForEvmTransactionReceipt({
    hash: challengeTransactionHash,
  })

  const clearChallengeWithdrawalState = useCallback(
    function () {
      // clear the challenge operation hash
      resetChallengeWithdrawal()
      // clear the challenge state
      queryClient.invalidateQueries({ queryKey: challengeQueryKey })
    },
    [challengeQueryKey, queryClient, resetChallengeWithdrawal],
  )

  useEffect(
    function updateWithdrawalAfterChallengeConfirmation() {
      if (challengeReceipt?.status !== 'success') {
        return
      }

      if (withdrawal.status === BtcWithdrawStatus.WITHDRAWAL_CHALLENGED) {
        return
      }

      clearChallengeWithdrawalState()

      updateWithdrawal(withdrawal, {
        status: BtcWithdrawStatus.WITHDRAWAL_CHALLENGED,
      })
    },
    [
      challengeReceipt,
      clearChallengeWithdrawalState,
      updateWithdrawal,
      withdrawal,
    ],
  )

  const handleChallengeWithdrawal = function () {
    // Clear any previous transaction hash, which may come from failed attempts
    updateWithdrawal(withdrawal, { challengeTxHash: undefined })
    challengeWithdrawal()
  }

  return {
    challengeError,
    challengeReceipt,
    challengeReceiptError,
    challengeWithdrawal: handleChallengeWithdrawal,
  }
}
