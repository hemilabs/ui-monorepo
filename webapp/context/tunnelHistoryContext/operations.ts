import { CrossChainMessenger, TokenBridgeMessage } from '@eth-optimism/sdk'
import { getBlock } from '@wagmi/core'
import { walletConfig } from 'app/context/walletContext'
import pThrottle from 'p-throttle'
import pMemoize from 'promise-mem'
import { type Address, type Chain } from 'viem'

import {
  TunnelOperation,
  RawTunnelOperation,
  DepositOperation,
  WithdrawOperation,
} from './types'

const throttlingOptions = { interval: 2000, limit: 1 }

const toOperation = <T extends TunnelOperation>(
  tunnelOperation: TokenBridgeMessage,
) =>
  ({
    ...tunnelOperation,
    // convert these types to something that we can serialize
    amount: tunnelOperation.amount.toString(),
  }) as RawTunnelOperation<T>

const pGetBlock = pMemoize(
  (blockNumber: TunnelOperation['blockNumber'], chainId: Chain['id']) =>
    getBlock(walletConfig, {
      blockNumber: BigInt(blockNumber),
      chainId,
    }),
  { resolver: (blockNumber, chainId) => `${blockNumber}-${chainId}` },
)

export const addTimestampToOperation = <T extends TunnelOperation>(
  operation: RawTunnelOperation<T>,
  chainId: Chain['id'],
) =>
  pGetBlock(operation.blockNumber, chainId).then(
    blockNumber =>
      ({
        ...operation,
        timestamp: Number(blockNumber.timestamp),
      }) as T,
  )

export const getDeposits = pThrottle(throttlingOptions)(
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
      .then(deposits =>
        deposits.map(deposit => toOperation<DepositOperation>(deposit)),
      ),
)

export const getWithdrawals = pThrottle(throttlingOptions)(
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
      .then(withdrawals =>
        withdrawals.map(withdrawal =>
          toOperation<WithdrawOperation>(withdrawal),
        ),
      ),
)
