import { type TokenBridgeMessage } from '@eth-optimism/sdk'
import { JsonRpcProvider } from '@ethersproject/providers'
import { BlockSyncType } from 'hooks/useSyncHistory/types'
import pAll from 'p-all'
import {
  createSlidingBlockWindow,
  CreateSlidingBlockWindow,
} from 'sliding-block-window/src'
import {
  EvmDepositOperation,
  EvmWithdrawOperation,
  TunnelOperation,
} from 'types/tunnel'
import {
  createCrossChainMessenger,
  type CrossChainMessengerProxy,
} from 'utils/crossChainMessenger'
import { getEvmBlock } from 'utils/evmApi'
import { createPublicProvider } from 'utils/providers'
import { type Chain } from 'viem'

import { getBlockPayload } from './common'
import { type HistorySyncer } from './types'

const toOperation =
  <T extends TunnelOperation>(l1ChainId: Chain['id'], l2ChainId: Chain['id']) =>
  (operations: TokenBridgeMessage[]) =>
    operations.map(
      ({ data, logIndex, ...tunnelOperation }: TokenBridgeMessage) =>
        ({
          ...tunnelOperation,
          // convert the amount to something that we can serialize
          amount: tunnelOperation.amount.toString(),
          l1ChainId,
          l2ChainId,
        }) as T,
    )

export const createEvmSync = function ({
  address,
  debug,
  depositsSyncInfo,
  l1Chain,
  l2Chain,
  saveHistory,
  withdrawalsSyncInfo,
}: HistorySyncer<BlockSyncType>) {
  const getBlockNumber = async function (
    toBlock: number,
    provider: JsonRpcProvider,
  ) {
    if (toBlock !== undefined) {
      return toBlock
    }
    debug('Getting block number for chain %s', provider.network.chainId)
    const blockNumber = Number(await provider.getBlockNumber())
    debug(
      'Last block number for chain %s is %s',
      provider.network.chainId,
      blockNumber,
    )
    return blockNumber
  }

  const syncDeposits = async function (
    chainProvider: JsonRpcProvider,
    crossChainMessengerPromise: Promise<CrossChainMessengerProxy>,
  ) {
    debug('Starting process to sync deposits')

    const [lastBlock, crossChainMessenger] = await Promise.all([
      getBlockNumber(depositsSyncInfo.toBlock, chainProvider),
      crossChainMessengerPromise,
    ])

    const initialBlock =
      depositsSyncInfo.fromBlock ?? depositsSyncInfo.minBlockToSync

    debug('Syncing deposits between blocks %s and %s', initialBlock, lastBlock)

    const onChange = async function ({
      canMove,
      nextState,
      state,
    }: Parameters<CreateSlidingBlockWindow['onChange']>[0]) {
      // we walk the blockchain backwards, but OP API expects
      // toBlock > fromBlock - so we must invert them
      const { from: toBlock, to: fromBlock, windowIndex } = state

      debug(
        'Getting deposits from block %s to %s (windowIndex %s)',
        fromBlock,
        toBlock,
        windowIndex,
      )
      const newDeposits = await crossChainMessenger
        .getDepositsByAddress(address, {
          fromBlock,
          toBlock,
        })
        .then(toOperation<EvmDepositOperation>(l1Chain.id, l2Chain.id))
        .then(deposits =>
          pAll(
            deposits.map(
              deposit =>
                async function () {
                  const block = await getEvmBlock(
                    deposit.blockNumber,
                    l1Chain.id,
                  )
                  return {
                    ...deposit,
                    timestamp: Number(block.timestamp),
                  }
                },
            ),
            { concurrency: 2 },
          ),
        )

      debug(
        'Got %s deposits from block %s to %s (windowIndex %s). Saving',
        newDeposits.length,
        fromBlock,
        toBlock,
        windowIndex,
      )

      // save the deposits
      saveHistory({
        payload: {
          ...getBlockPayload({
            canMove,
            fromBlock: depositsSyncInfo.fromBlock,
            lastBlock,
            nextState,
          }),
          chainId: l1Chain.id,
          content: newDeposits,
        },
        type: 'sync-deposits',
      })
    }

    return createSlidingBlockWindow({
      initialBlock,
      lastBlock,
      onChange,
      windowIndex: depositsSyncInfo.chunkIndex,
      windowSize: depositsSyncInfo.blockWindowSize,
    }).run()
  }

  const syncWithdrawals = async function (
    chainProvider: JsonRpcProvider,
    crossChainMessengerPromise: Promise<CrossChainMessengerProxy>,
  ) {
    debug('Starting process to sync withdrawals')

    const [lastBlock, crossChainMessenger] = await Promise.all([
      getBlockNumber(withdrawalsSyncInfo.toBlock, chainProvider),
      crossChainMessengerPromise,
    ])

    const initialBlock =
      withdrawalsSyncInfo.fromBlock ?? withdrawalsSyncInfo.minBlockToSync ?? 0

    debug(
      'Syncing withdrawals between blocks %s and %s',
      initialBlock,
      lastBlock,
    )

    const onChange = async function ({
      canMove,
      nextState,
      state,
    }: Parameters<CreateSlidingBlockWindow['onChange']>[0]) {
      // we walk the blockchain backwards, but OP API expects
      // toBlock > fromBlock - so we must invert them
      const { from: toBlock, to: fromBlock, windowIndex } = state

      debug(
        'Getting withdrawals from block %s to %s (windowIndex %s)',
        fromBlock,
        toBlock,
        windowIndex,
      )
      const newWithdrawals = await crossChainMessenger
        .getWithdrawalsByAddress(address, {
          fromBlock,
          toBlock,
        })
        .then(toOperation<EvmWithdrawOperation>(l1Chain.id, l2Chain.id))
        .then(withdrawals =>
          pAll(
            withdrawals.map(
              withdrawal =>
                async function () {
                  const [block, status] = await Promise.all([
                    getEvmBlock(withdrawal.blockNumber, l2Chain.id),
                    crossChainMessenger.getMessageStatus(
                      withdrawal.transactionHash,
                      // default value
                      0,
                      withdrawal.direction,
                    ),
                  ])
                  return {
                    ...withdrawal,
                    status,
                    timestamp: Number(block.timestamp),
                  }
                },
            ),
            { concurrency: 2 },
          ),
        )

      debug(
        'Got %s withdrawals from block %s to %s (windowIndex %s). Saving',
        newWithdrawals.length,
        fromBlock,
        toBlock,
        windowIndex,
      )

      // save the withdrawals
      saveHistory({
        payload: {
          ...getBlockPayload({
            canMove,
            fromBlock: withdrawalsSyncInfo.fromBlock,
            lastBlock,
            nextState,
          }),
          chainId: l1Chain.id,
          content: newWithdrawals,
        },
        type: 'sync-withdrawals',
      })
    }

    return createSlidingBlockWindow({
      initialBlock,
      lastBlock,
      onChange,
      windowIndex: withdrawalsSyncInfo.chunkIndex,
      windowSize: withdrawalsSyncInfo.blockWindowSize,
    }).run()
  }

  const syncHistory = function () {
    // EVM chains use Ethers providers because that's what
    // the cross-chain messenger expects
    debug('Creating providers')
    const l1Provider = createPublicProvider(
      l1Chain.rpcUrls.default.http[0],
      l1Chain,
    )

    const l2Provider = createPublicProvider(
      l2Chain.rpcUrls.default.http[0],
      l2Chain,
    )

    const crossChainMessengerPromise = createCrossChainMessenger({
      l1ChainId: l1Chain.id,
      l1Signer: l1Provider,
      l2Signer: l2Provider,
    })

    return Promise.all([
      syncDeposits(l1Provider, crossChainMessengerPromise).then(() =>
        debug('Deposits sync finished'),
      ),
      syncWithdrawals(l2Provider, crossChainMessengerPromise).then(() =>
        debug('Withdrawals sync finished'),
      ),
    ]).then(function () {
      debug('Sync process finished')
    })
  }

  return {
    syncHistory,
  }
}
