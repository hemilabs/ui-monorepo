import { MessageDirection, MessageStatus } from '@eth-optimism/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTunnelOperation } from 'app/[locale]/tunnel/_hooks/useTunnelOperation'
import { bitcoin, hemi } from 'app/networks'
import { BtcChain } from 'btc-wallet/chains'
import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { Satoshis } from 'btc-wallet/unisat'
import {
  BtcDepositOperation,
  BtcDepositStatus,
} from 'context/tunnelHistoryContext/types'
import { useCallback } from 'react'
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

import { useHemiClient, useHemiWalletClient } from './useHemiClient'
import { useTunnelHistory } from './useTunnelHistory'
import { useWaitForTransactionReceipt as useWaitForBtcTransactionReceipt } from './useWaitForTransactionReceipt'

export const useClaimBitcoinDeposit = function () {
  const { address } = useEvmAccount()
  const hemiClient = useHemiClient()
  const queryClient = useQueryClient()
  const { hemiWalletClient } = useHemiWalletClient()

  const {
    error: claimBitcoinDepositError,
    reset: resetClaimBitcoinDeposit,
    mutate: claimBitcoinDeposit,
    data: claimBitcoinDepositTxHash,
  } = useMutation({
    mutationFn: (deposit: BtcDepositOperation) =>
      claimBtcDeposit({
        deposit,
        from: address,
        hemiClient,
        hemiWalletClient,
      }),
    mutationKey: [hemiClient, hemiWalletClient],
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

  return {
    claimBitcoinDeposit,
    claimBitcoinDepositError,
    claimBitcoinDepositReceipt,
    claimBitcoinDepositReceiptError,
    claimBitcoinDepositTxHash,
    clearClaimBitcoinDepositState,
  }
}

export const useDepositBitcoin = function () {
  const { address, connector } = useBtcAccount()
  const hemiClient = useHemiClient()
  const { addDepositToTunnelHistory } = useTunnelHistory()
  const { updateTxHash } = useTunnelOperation()
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
      // See https://github.com/hemilabs/ui-monorepo/issues/462
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
  const { address: btcAddress } = useBtcAccount()
  const { address: hemiAddress } = useEvmAccount()
  const hemiClient = useHemiClient()
  const { hemiWalletClient } = useHemiWalletClient()
  const { addWithdrawalToTunnelHistory } = useTunnelHistory()
  const queryClient = useQueryClient()

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
        l2Token: getNativeToken(bitcoin.id).extensions.bridgeInfo[hemi.id]
          .tokenAddress,
        status: MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE,
        to: btcAddress,
        transactionHash,
      })
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

  return {
    clearWithdrawBitcoinState,
    withdrawBitcoin,
    withdrawBitcoinReceipt,
    withdrawBitcoinReceiptError,
    withdrawError,
    withdrawTxHash,
  }
}
