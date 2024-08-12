import { type TokenBridgeMessage } from '@eth-optimism/sdk'
import { JsonRpcProvider } from '@ethersproject/providers'
import {
  EvmDepositOperation,
  EvmWithdrawOperation,
  TunnelOperation,
} from 'context/tunnelHistoryContext/types'
import { Debugger } from 'debug'
import pAll from 'p-all'
import {
  createSlidingBlockWindow,
  CreateSlidingBlockWindow,
} from 'sliding-block-window/src'
import {
  createCrossChainMessenger,
  type CrossChainMessengerProxy,
} from 'utils/crossChainMessenger'
import { getEvmBlock } from 'utils/evmApi'
import { createPublicProvider } from 'utils/providers'
import { type Chain } from 'viem'

import {
  type EvmSyncParameters,
  type ExtendedSyncInfo,
  type SaveHistory,
  type SyncInfo,
} from './types'

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
  depositSyncInfo,
  l1Chain,
  l2Chain,
  saveHistory,
  withdrawSyncInfo,
}: Pick<EvmSyncParameters, 'address'> & {
  debug: Debugger
  depositSyncInfo: ExtendedSyncInfo
  l1Chain: Chain
  l2Chain: Chain
  saveHistory: SaveHistory
  withdrawSyncInfo: ExtendedSyncInfo
}) {
  const getBlockNumber = async function (
    { toBlock }: SyncInfo,
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

  const getPayload = function ({
    canMove,
    fromBlock,
    lastBlock,
    nextState,
  }: {
    canMove: boolean
    fromBlock: SyncInfo['fromBlock']
    lastBlock: number
    nextState: Parameters<CreateSlidingBlockWindow['onChange']>[0]['nextState']
  }) {
    const hasSyncToMinBlock = !canMove
    return {
      // if we finished, we should start from the beginning the next time with the new values
      chunkIndex: hasSyncToMinBlock ? 0 : nextState.windowIndex,
      // If we finished syncing, the upper bound is the last block we've synced up to
      // so next time we should start from that block + 1 (the following one).
      // If we haven't finished, we keep the same value
      fromBlock: hasSyncToMinBlock ? lastBlock + 1 : fromBlock,
      hasSyncToMinBlock,
      // if we finished synced, the next "toBlock" value will be retrieved
      // in runtime, so we must clear it. Otherwise, keep the existing value
      toBlock: hasSyncToMinBlock ? undefined : lastBlock,
    }
  }

  const syncDeposits = async function (
    chainProvider: JsonRpcProvider,
    crossChainMessengerPromise: Promise<CrossChainMessengerProxy>,
  ) {
    debug('Starting process to sync deposits')

    const [lastBlock, crossChainMessenger] = await Promise.all([
      getBlockNumber(depositSyncInfo, chainProvider),
      crossChainMessengerPromise,
    ])

    const initialBlock =
      depositSyncInfo.fromBlock ?? depositSyncInfo.minBlockToSync

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
            { concurrency: 3 },
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
          ...getPayload({
            canMove,
            fromBlock: depositSyncInfo.fromBlock,
            lastBlock,
            nextState,
          }),
          chainId: l1Chain.id,
          content: newDeposits,
        },
        type: 'sync-deposits',
      })
    }

    await createSlidingBlockWindow({
      initialBlock,
      lastBlock,
      onChange,
      windowIndex: depositSyncInfo.chunkIndex,
      windowSize: depositSyncInfo.blockWindowSize,
    }).run()
  }

  const syncWithdrawals = async function (
    chainProvider: JsonRpcProvider,
    crossChainMessengerPromise: Promise<CrossChainMessengerProxy>,
  ) {
    debug('Starting process to sync withdrawals')

    const [lastBlock, crossChainMessenger] = await Promise.all([
      getBlockNumber(withdrawSyncInfo, chainProvider),
      crossChainMessengerPromise,
    ])

    const initialBlock =
      withdrawSyncInfo.fromBlock ?? withdrawSyncInfo.minBlockToSync ?? 0

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
                    getEvmBlock(withdrawal.blockNumber, l1Chain.id),
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
            { concurrency: 3 },
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
          ...getPayload({
            canMove,
            fromBlock: withdrawSyncInfo.fromBlock,
            lastBlock,
            nextState,
          }),
          chainId: l1Chain.id,
          content: newWithdrawals,
        },
        type: 'sync-withdrawals',
      })
    }

    await createSlidingBlockWindow({
      initialBlock,
      lastBlock,
      onChange,
      windowIndex: withdrawSyncInfo.chunkIndex,
      windowSize: withdrawSyncInfo.blockWindowSize,
    }).run()
  }

  const syncHistory = function () {
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
      syncDeposits(l1Provider, crossChainMessengerPromise),
      syncWithdrawals(l2Provider, crossChainMessengerPromise),
    ]).then(function () {
      debug('Sync process finished')
    })
  }

  return {
    syncHistory,
  }
}
