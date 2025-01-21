import { type TokenBridgeMessage } from '@eth-optimism/sdk'
import { type BaseProvider } from '@ethersproject/providers'
import { BlockSyncType } from 'hooks/useSyncHistory/types'
import pAll from 'p-all'
import pThrottle from 'p-throttle'
import {
  createSlidingBlockWindow,
  CreateSlidingBlockWindow,
} from 'sliding-block-window/src'
import {
  EvmDepositOperation,
  EvmDepositStatus,
  ToEvmWithdrawOperation,
  TunnelOperation,
} from 'types/tunnel'
import {
  createQueuedCrossChainMessenger,
  type CrossChainMessengerProxy,
} from 'utils/crossChainMessenger'
import { getEvmBlock } from 'utils/evmApi'
import { createProvider } from 'utils/providers'
import { type Chain } from 'viem'

import { getBlockNumber, getBlockPayload } from './common'
import { type HistorySyncer } from './types'

const throttlingOptions = { interval: 2000, limit: 1, strict: true }

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
          // If deposits are found, it means they are confirmed. There's no other possible status
          // This may not be the case if we Get txs from the user's account, instead of checking logs
          // as failed deposits will also appear https://github.com/hemilabs/ui-monorepo/issues/743
          status: EvmDepositStatus.DEPOSIT_TX_CONFIRMED,
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
  const syncDeposits = async function (
    chainProvider: BaseProvider,
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
                    deposit.blockNumber!,
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
      onChange: pThrottle(throttlingOptions)(onChange),
      windowIndex: depositsSyncInfo.chunkIndex,
      windowSize: depositsSyncInfo.blockWindowSize,
    }).run()
  }

  const syncWithdrawals = async function (
    chainProvider: BaseProvider,
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
        .then(toOperation<ToEvmWithdrawOperation>(l1Chain.id, l2Chain.id))
        .then(withdrawals =>
          pAll(
            withdrawals.map(
              withdrawal =>
                async function () {
                  const [block, status] = await Promise.all([
                    getEvmBlock(withdrawal.blockNumber!, l2Chain.id),
                    crossChainMessenger.getMessageStatus(
                      withdrawal.transactionHash,
                      // default value
                      0,
                      withdrawal.direction,
                    ),
                  ])
                  // TODO Bring the Prove and Claim transaction hashes.
                  // See https://github.com/hemilabs/ui-monorepo/issues/558
                  return {
                    ...withdrawal,
                    status,
                    timestamp: Number(block.timestamp),
                  }
                },
            ),
            { concurrency: 1 },
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
      onChange: pThrottle(throttlingOptions)(onChange),
      windowIndex: withdrawalsSyncInfo.chunkIndex,
      windowSize: withdrawalsSyncInfo.blockWindowSize,
    }).run()
  }

  const syncHistory = function () {
    // EVM chains use Ethers providers because that's what
    // the cross-chain messenger expects
    debug('Creating providers')
    const l1Provider = createProvider(l1Chain)

    const l2Provider = createProvider(l2Chain)

    const crossChainMessengerPromise = createQueuedCrossChainMessenger({
      l1ChainId: l1Chain.id,
      l1Signer: l1Provider,
      l2Chain,
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
