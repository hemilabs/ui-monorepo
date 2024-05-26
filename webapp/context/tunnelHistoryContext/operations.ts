import { CrossChainMessenger, TokenBridgeMessage } from '@eth-optimism/sdk'
import { getBlock } from '@wagmi/core'
import { getWalletConfig } from 'app/context/walletContext'
import pThrottle from 'p-throttle'
import pMemoize from 'promise-mem'
import { type Address, type Chain } from 'viem'

import { TunnelOperation, DepositOperation, WithdrawOperation } from './types'

const toOperation = <T extends DepositOperation | WithdrawOperation>(
  tunnelOperation: TokenBridgeMessage,
) =>
  ({
    ...tunnelOperation,
    // convert these types to something that we can serialize
    amount: tunnelOperation.amount.toString(),
  }) as T

const pGetBlock = pMemoize(
  (blockNumber: TunnelOperation['blockNumber'], chainId: Chain['id']) =>
    getBlock(getWalletConfig(), {
      blockNumber: BigInt(blockNumber),
      chainId,
    }),
  { resolver: (blockNumber, chainId) => `${blockNumber}-${chainId}` },
)

export const addTimestampToOperation = (
  operation: Omit<TunnelOperation, 'timestamp'>,
  chainId: Chain['id'],
) =>
  pGetBlock(operation.blockNumber, chainId).then(blockNumber => ({
    ...operation,
    timestamp: Number(blockNumber.timestamp),
  }))

export const getDeposits = pThrottle({ interval: 1000, limit: 2 })(
  ({
    address,
    crossChainMessenger,
    fromBlock,
    toBlock,
  }: {
    address: Address
    crossChainMessenger: CrossChainMessenger
    fromBlock: number
    toBlock: number
  }) =>
    crossChainMessenger
      .getDepositsByAddress(address, {
        fromBlock,
        toBlock,
      })
      .then(deposits => deposits.map(toOperation)),
)

export const getWithdrawals = pThrottle({ interval: 1000, limit: 2 })(
  ({
    address,
    crossChainMessenger,
    fromBlock,
    toBlock,
  }: {
    address: Address
    crossChainMessenger: CrossChainMessenger
    fromBlock: number
    toBlock: number
  }) =>
    crossChainMessenger
      .getWithdrawalsByAddress(address, {
        fromBlock,
        toBlock,
      })
      .then(withdrawals => withdrawals.map(toOperation)),
)
