import { MessageDirection } from '@eth-optimism/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bitcoin, hemi } from 'app/networks'
import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { Satoshis } from 'btc-wallet/unisat'
import {
  BtcDepositOperation,
  BtcDepositStatus,
} from 'context/tunnelHistoryContext/types'
import { useCallback } from 'react'
import { useQueryParams } from 'ui-common/hooks/useQueryParams'
import { claimBtcDeposit, initiateBtcDeposit } from 'utils/hemi'
import { getNativeToken } from 'utils/token'
import { type Address } from 'viem'
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
  const { addBtcDepositToTunnelHistory } = useTunnelHistory()
  const { setQueryParams } = useQueryParams()
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
    }) =>
      initiateBtcDeposit({
        hemiAddress,
        hemiClient,
        satoshis,
        walletConnector: connector,
      }),
    mutationKey: [connector, hemiClient],
    onSuccess({ bitcoinCustodyAddress, txHash }, { satoshis }) {
      const btc = getNativeToken(bitcoin.id)
      addBtcDepositToTunnelHistory({
        amount: satoshis.toString(),
        chainId: bitcoin.id,
        direction: MessageDirection.L1_TO_L2,
        from: address,
        l1Token: btc.address,
        l2Token: btc.extensions.bridgeInfo[hemi.id].tokenAddress,
        status: BtcDepositStatus.TX_PENDING,
        to: bitcoinCustodyAddress,
        transactionHash: txHash,
      })
      setQueryParams({ txHash }, 'push')
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
