import { CrossChainMessenger, TokenBridgeMessage } from '@eth-optimism/sdk'
import {
  getBlock as wagmiGetBlock,
  getTransactionReceipt as wagmiGetTransactionReceipt,
} from '@wagmi/core'
import { evmWalletConfig } from 'app/context/evmWalletContext'
import pThrottle from 'p-throttle'
import pMemoize from 'promise-mem'
import { type Address, type Chain, type Hash } from 'viem'

import {
  TunnelOperation,
  RawTunnelOperation,
  EvmDepositOperation,
  EvmWithdrawOperation,
} from './types'

const throttlingOptions = { interval: 2000, limit: 1 }

const toOperation = <T extends TunnelOperation>({
  data,
  logIndex,
  ...tunnelOperation
}: TokenBridgeMessage) =>
  ({
    ...tunnelOperation,
    // convert these types to something that we can serialize
    amount: tunnelOperation.amount.toString(),
  }) as RawTunnelOperation<T>

export const getBlock = pMemoize(
  (blockNumber: TunnelOperation['blockNumber'], chainId: Chain['id']) =>
    wagmiGetBlock(evmWalletConfig, {
      blockNumber: BigInt(blockNumber),
      chainId,
    }),
  { resolver: (blockNumber, chainId) => `${blockNumber}-${chainId}` },
)

export const getTransactionReceipt = (hash: Hash, chainId: Chain['id']) =>
  wagmiGetTransactionReceipt(evmWalletConfig, {
    chainId,
    hash,
  })

export const addTimestampToOperation = <T extends TunnelOperation>(
  operation: RawTunnelOperation<T>,
  chainId: Chain['id'],
) =>
  getBlock(operation.blockNumber, chainId).then(
    blockNumber =>
      ({
        ...operation,
        timestamp: Number(blockNumber.timestamp),
      }) as T,
  )

export const getDeposits = (crossChainMessenger: CrossChainMessenger) =>
  pThrottle(throttlingOptions)(
    ({
      address,
      fromBlock,
      toBlock,
    }: {
      address: Address
      fromBlock: number
      toBlock: number
    }) =>
      crossChainMessenger
        .getDepositsByAddress(address, {
          fromBlock,
          toBlock,
        })
        .then(deposits =>
          deposits.map(deposit => toOperation<EvmDepositOperation>(deposit)),
        ),
  )

export const getWithdrawals = (crossChainMessenger: CrossChainMessenger) =>
  pThrottle(throttlingOptions)(
    ({
      address,
      fromBlock,
      toBlock,
    }: {
      address: Address
      fromBlock: number
      toBlock: number
    }) =>
      crossChainMessenger
        .getWithdrawalsByAddress(address, {
          fromBlock,
          toBlock,
        })
        .then(withdrawals =>
          withdrawals.map(withdrawal =>
            toOperation<EvmWithdrawOperation>(withdrawal),
          ),
        ),
  )
