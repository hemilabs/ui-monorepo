import { type TokenBridgeMessage } from '@eth-optimism/sdk'
import { JsonRpcProvider } from '@ethersproject/providers'
import { EvmDepositOperation } from 'context/tunnelHistoryContext/types'
import { Debugger } from 'debug'
import pAll from 'p-all'
import {
  createSlidingBlockWindow,
  CreateSlidingBlockWindow,
} from 'sliding-block-window/src'
import { getCrossChainMessenger } from 'utils/crossChainMessenger'
import { getEvmBlock } from 'utils/evmApi'
import { createPublicProvider } from 'utils/providers'
import { type Chain } from 'viem'

import {
  type EvmSyncParameters,
  type HistoryState,
  type SaveHistory,
} from './types'

const toOperation =
  (l1ChainId: Chain['id'], l2ChainId: Chain['id']) =>
  (deposits: TokenBridgeMessage[]) =>
    deposits.map(
      ({ data, logIndex, ...tunnelOperation }: TokenBridgeMessage) =>
        ({
          ...tunnelOperation,
          // convert the amount to something that we can serialize
          amount: tunnelOperation.amount.toString(),
          // chainId: For backwards compatibility but will be deprecated
          chainId: l1ChainId,
          l1ChainId,
          l2ChainId,
        }) as EvmDepositOperation,
    )

export const createEvmSync = function ({
  address,
  debug,
  l1Chain,
  l2Chain,
  saveHistory,
  syncInfo,
}: Pick<EvmSyncParameters, 'address'> & {
  debug: Debugger
  l1Chain: Chain
  l2Chain: Chain
  saveHistory: SaveHistory
  syncInfo: HistoryState['syncInfo'] & {
    blockWindowSize: number
    minBlockToSync?: number
  }
}) {
  const getBlockNumber = async function (
    { toBlock }: HistoryState['syncInfo'],
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
    l1Provider: JsonRpcProvider,
    l2Provider: JsonRpcProvider,
  ) {
    debug('Starting process to sync deposits')

    const [lastBlock, crossChainMessenger] = await Promise.all([
      getBlockNumber(syncInfo, l1Provider),
      getCrossChainMessenger({
        l1ChainId: l1Chain.id,
        l1Signer: l1Provider,
        l2Signer: l2Provider,
      }),
    ])

    const initialBlock = syncInfo.fromBlock ?? syncInfo.minBlockToSync

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
        .then(toOperation(l1Chain.id, l2Chain.id))
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

      // if it can't move, it means we've reached the last block we wanted to sync
      const hasSyncToMinBlock = !canMove
      // save the deposits
      saveHistory({
        payload: {
          chainId: l1Chain.id,
          // if we finished, we should start from the beginning the next time with the new values
          chunkIndex: hasSyncToMinBlock ? 0 : nextState.windowIndex,
          deposits: newDeposits,
          // If we finished syncing, the upper bound is the last block we've synced up to
          // so next time we should start from that block + 1 (the following one).
          // If we haven't finished, we keep the same value
          fromBlock: hasSyncToMinBlock ? lastBlock + 1 : syncInfo.fromBlock,
          hasSyncToMinBlock,
          // if we finished synced, the next "toBlock" value will be retrieved
          // in runtime, so we must clear it. Otherwise, keep the existing value
          toBlock: hasSyncToMinBlock ? undefined : lastBlock,
        },
        type: 'sync-deposits',
      })
    }

    await createSlidingBlockWindow({
      initialBlock,
      lastBlock,
      onChange,
      windowIndex: syncInfo.chunkIndex,
      windowSize: syncInfo.blockWindowSize,
    }).run()
  }

  const syncWithdrawals = function () {}

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

    return Promise.all([
      syncDeposits(l1Provider, l2Provider),
      syncWithdrawals(),
    ]).then(function () {
      debug('Sync process finished')
    })
  }

  return {
    syncHistory,
  }
}
