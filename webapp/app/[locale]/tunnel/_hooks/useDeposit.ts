import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useUmami } from 'app/analyticsEvents'
import { TransactionsInProgressContext } from 'context/transactionsInProgressContext'
import { EventEmitter } from 'events'
import { depositErc20, depositEth } from 'hemi-tunnel-actions'
import { DepositErc20Events } from 'hemi-tunnel-actions/src/types'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useUpdateNativeBalanceAfterReceipt } from 'hooks/useInvalidateNativeBalanceAfterReceipt'
import { useL1StandardBridgeAddress } from 'hooks/useL1StandardBridgeAddress'
import { useL1WalletClient } from 'hooks/useL1WalletClient'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useContext } from 'react'
import { NativeTokenSpecialAddressOnL2 } from 'tokenList/nativeTokens'
import { type EvmToken } from 'types/token'
import {
  EvmDepositOperation,
  EvmDepositStatus,
  MessageDirection,
} from 'types/tunnel'
import { findChainById } from 'utils/chain'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { isNativeAddress } from 'utils/nativeToken'
import { Chain, parseUnits, zeroAddress } from 'viem'
import { useAccount } from 'wagmi'

import { useTunnelOperation } from './useTunnelOperation'
const ExtraApprovalTimesAmount = 10

type UseDeposit = {
  extendedErc20Approval?: boolean | undefined
  fromInput: string
  fromToken: EvmToken
  on?: (emitter: EventEmitter<DepositErc20Events>) => void
  toToken: EvmToken
}

export const useDeposit = function ({
  extendedErc20Approval,
  fromInput,
  fromToken,
  on,
  toToken,
}: UseDeposit) {
  const amount = parseUnits(fromInput, fromToken.decimals)

  const { address } = useAccount()
  const { addTransaction, clearTransactionsInMemory } = useContext(
    TransactionsInProgressContext,
  )
  const { queryKey: nativeTokenBalanceQueryKey } = useNativeTokenBalance(
    fromToken.chainId,
  )
  const l1StandardBridgeAddress = useL1StandardBridgeAddress(fromToken.chainId)
  const [networkType] = useNetworkType()
  const queryClient = useQueryClient()
  const { queryKey: erc20BalanceQueryKey } = useTokenBalance(
    fromToken.chainId,
    fromToken.address,
  )

  const { addDepositToTunnelHistory, updateDeposit } = useTunnelHistory()
  const { updateTxHash, txHash: currentTxHash } = useTunnelOperation()
  const { track } = useUmami()
  const updateNativeBalanceAfterFees = useUpdateNativeBalanceAfterReceipt(
    fromToken.chainId,
  )
  const { l1WalletClient } = useL1WalletClient(fromToken.chainId)

  const depositingNative = isNativeAddress(fromToken.address)

  const { allowanceQueryKey } = useNeedsApproval({
    address: fromToken.address,
    amount,
    spender: l1StandardBridgeAddress,
  })

  return useMutation({
    mutationFn() {
      track?.('evm - dep started', { chain: networkType })

      const { promise, emitter } = depositingNative
        ? depositEth({
            account: address,
            amount,
            // here both chains are always EVM
            l1Chain: findChainById(fromToken.chainId) as Chain,
            l1PublicClient: getEvmL1PublicClient(fromToken.chainId),
            l1WalletClient,
            l2Chain: findChainById(toToken.chainId) as Chain,
          })
        : depositErc20({
            account: address,
            amount,
            approvalAmount: extendedErc20Approval
              ? amount * BigInt(ExtraApprovalTimesAmount)
              : amount,
            l1Chain: findChainById(fromToken.chainId) as Chain,
            l1PublicClient: getEvmL1PublicClient(fromToken.chainId),
            // @ts-expect-error string is Address
            l1TokenAddress: fromToken.address,
            l1WalletClient,
            l2Chain: findChainById(toToken.chainId) as Chain,
            // @ts-expect-error string is Address
            l2TokenAddress: toToken.address,
          })

      let deposit: EvmDepositOperation | undefined

      const getDeposit = () => ({
        amount: amount.toString(),
        direction: MessageDirection.L1_TO_L2,
        from: address,
        l1ChainId: fromToken.chainId,
        l1Token: depositingNative ? zeroAddress : fromToken.address,
        l2ChainId: toToken.chainId,
        l2Token: depositingNative
          ? NativeTokenSpecialAddressOnL2
          : toToken.address,
        // "to" field uses the same address as from, which is user's address
        to: address,
      })

      emitter.on('user-signed-approve', function (approvalTxHash) {
        deposit = {
          ...getDeposit(),
          approvalTxHash,
          status: EvmDepositStatus.APPROVAL_TX_PENDING,
          transactionHash: approvalTxHash,
        }
        // save the Approval Transaction hash to the list of transactions in progress
        // so the drawer can be shown until we get our deposit TX hash
        addTransaction(deposit)
        // and now, add that hash to the url. It will be used until the Deposit hash is generated
        updateTxHash(approvalTxHash, { history: 'push' })
      })
      emitter.on('approve-transaction-reverted', function (receipt) {
        updateNativeBalanceAfterFees(receipt)
      })
      emitter.on('approve-transaction-succeeded', function (receipt) {
        updateNativeBalanceAfterFees(receipt)
        queryClient.invalidateQueries({ queryKey: allowanceQueryKey })
      })
      emitter.on('user-signed-deposit', function (transactionHash) {
        const updates = {
          status: EvmDepositStatus.DEPOSIT_TX_PENDING,
          transactionHash,
        }
        if (deposit) {
          Object.assign(deposit, updates)
        } else {
          deposit = {
            ...getDeposit(),
            ...updates,
          }
        }
        addDepositToTunnelHistory(deposit)
        // add hash to query string. If a hash was in place before, it should be replaced.
        updateTxHash(transactionHash, {
          history: currentTxHash ? 'replace' : 'push',
        })
        // Clear, if any, the approval txs in memory
        clearTransactionsInMemory()
      })
      emitter.on('deposit-transaction-succeeded', function (receipt) {
        const { blockNumber } = receipt
        // timestamp will be loaded by background workers
        updateDeposit(deposit, {
          blockNumber: Number(blockNumber),
          status: EvmDepositStatus.DEPOSIT_TX_CONFIRMED,
        })
        track?.('evm - dep success', { chain: networkType })
        // update balances, they will be revalidated on background.
        // We update the native token considering the gas spent, and the token deposited
        if (depositingNative) {
          // deposited + fees
          updateNativeBalanceAfterFees(receipt, amount)
        } else {
          // fees
          updateNativeBalanceAfterFees(receipt)
          // deposited
          queryClient.setQueryData(
            erc20BalanceQueryKey,
            (old: bigint) => old - amount,
          )
        }
      })
      emitter.on('deposit-transaction-reverted', function (receipt) {
        updateDeposit(deposit, {
          status: EvmDepositStatus.DEPOSIT_TX_FAILED,
        })

        track?.('evm - dep failed', { chain: networkType })
        // Although the transaction was reverted, the gas was paid.
        updateNativeBalanceAfterFees(receipt)
      })

      on?.(emitter)

      return promise
    },
    onSettled: () =>
      Promise.all([
        // gas was paid in the L1 chain, so we need to invalidate the balance
        queryClient.invalidateQueries({
          queryKey: nativeTokenBalanceQueryKey,
        }),
        // if we deposited an ERC20 token, we must invalidate the allowance and balance as well
        ...(depositingNative
          ? []
          : [
              queryClient.invalidateQueries({
                queryKey: erc20BalanceQueryKey,
              }),
              queryClient.invalidateQueries({ queryKey: allowanceQueryKey }),
            ]),
      ]),
  })
}
