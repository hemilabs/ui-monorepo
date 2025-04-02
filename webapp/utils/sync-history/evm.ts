import { type TokenBridgeMessage } from '@eth-optimism/sdk'
import { type BaseProvider } from '@ethersproject/providers'
import { featureFlags } from 'app/featureFlags'
import { BlockSyncType } from 'hooks/useSyncHistory/types'
import pAll from 'p-all'
import pDoWhilst from 'p-do-whilst'
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
import { getEvmL1PublicClient } from 'utils/chainClients'
import {
  createQueuedCrossChainMessenger,
  type CrossChainMessengerProxy,
} from 'utils/crossChainMessenger'
import { getEvmBlock, getEvmTransactionReceipt } from 'utils/evmApi'
import { createProvider } from 'utils/providers'
import {
  getEvmDeposits,
  getEvmWithdrawals,
  getLastIndexedBlock,
} from 'utils/subgraph'
import { getEvmWithdrawalStatus } from 'utils/tunnel'
import { type Chain } from 'viem'

import { chainConfiguration } from './chainConfiguration'
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
  const syncDepositsWithOpSdk = async function (
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

  const syncDepositsSubgraph = async function () {
    // Get this before reading the Subgraph, to ensure next time we don't miss some blocks due
    // to some race condition.
    const lastIndexedBlock = await getLastIndexedBlock(l1Chain.id)

    const shouldQueryDeposits = (limit: number, depositsAmount: number) =>
      limit === depositsAmount

    const fromBlock =
      depositsSyncInfo.fromBlock ??
      // or the oldest block configured for this chain, if it is the first time
      chainConfiguration[l1Chain.id].minBlockToSync ??
      // or bring everything! (just for type-safety, but should never occur)
      0

    // As awful as it is, graph-node doesn't support cursor pagination (which is the
    // recommended way to paginate in graphQL). It also doesn't support a way to natively get
    // the amount of Entities saved in the subgraph. As the UI use a infinite scrolling pagination,
    // we don't need to "list" the total of operations. However, in order to load deposits, our best option
    // is to use limit/skip and keep querying until less entities than the $limit are returned.
    // See https://github.com/graphprotocol/graph-node/issues/613 and
    // https://github.com/graphprotocol/graph-node/issues/1309
    await pDoWhilst(
      async function ({
        limit,
        skip,
      }: {
        deposits: EvmDepositOperation[]
        limit: number
        skip: number
      }) {
        const newDeposits = await getEvmDeposits({
          address,
          chainId: l1Chain.id,
          // from the oldest block we've queried before
          fromBlock,
          limit,
          skip,
        }).then(deps =>
          deps.map(
            d =>
              ({
                // if found, it's a confirmed deposit
                ...d,
                status: EvmDepositStatus.DEPOSIT_TX_CONFIRMED,
              }) satisfies EvmDepositOperation,
          ),
        )

        // save the deposits
        saveHistory({
          payload: {
            chainId: l1Chain.id,
            // TODO once feature flag is removed, this field is no longer needed.
            // See https://github.com/hemilabs/ui-monorepo/issues/743
            chunkIndex: 0,
            content: newDeposits,
            // only update the "fromBlock" if we have finished querying all deposits. Otherwise
            // we may miss some deposits. Once all were loaded, and saved in local storage, next time
            // we can start querying again from the current last indexed block of the subgraph
            fromBlock: shouldQueryDeposits(limit, newDeposits.length)
              ? fromBlock
              : lastIndexedBlock + 1,
            // TODO once feature flag is removed, this field is no longer needed.
            // See https://github.com/hemilabs/ui-monorepo/issues/743
            hasSyncToMinBlock: true,
            toBlock: undefined,
          },
          type: 'sync-deposits',
        })

        return {
          deposits: newDeposits,
          limit,
          skip: skip + limit,
        }
      },
      ({ deposits, limit }) => shouldQueryDeposits(limit, deposits.length),
      { deposits: [], limit: 100, skip: 0 },
    )
  }

  const syncDeposits = (
    chainProvider: BaseProvider,
    crossChainMessengerPromise: Promise<CrossChainMessengerProxy>,
  ) =>
    featureFlags.syncHistoryWithSubgraph
      ? syncDepositsSubgraph()
      : syncDepositsWithOpSdk(chainProvider, crossChainMessengerPromise)

  const syncWithdrawalsWithOpSdk = async function (
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

    const l1publicClient = getEvmL1PublicClient(l1Chain.id)

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
                    getEvmTransactionReceipt(
                      withdrawal.transactionHash,
                      withdrawal.l2ChainId,
                    ).then(receipt =>
                      getEvmWithdrawalStatus({
                        l1publicClient,
                        l2ChainId: l2Chain.id,
                        receipt,
                      }),
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

  const syncWithdrawalsWithSubgraph = async function () {
    const withdrawalsPageSize = 100
    // Get this before reading the Subgraph, to ensure next time we don't miss some blocks due
    // to some race condition.
    const lastIndexedBlock = await getLastIndexedBlock(l2Chain.id)

    const shouldQueryWithdrawals = (limit: number, withdrawalsAmount: number) =>
      limit === withdrawalsAmount

    const fromBlock =
      withdrawalsSyncInfo.fromBlock ??
      // or the oldest block configured for this chain, if it is the first time
      chainConfiguration[l2Chain.id].minBlockToSync ??
      // or bring everything! (just for type-safety, but should never occur)
      0

    // As awful as it is, graph-node doesn't support cursor pagination (which is the
    // recommended way to paginate in graphQL). It also doesn't support a way to natively get
    // the amount of Entities saved in the subgraph. As the UI use a infinite scrolling pagination,
    // we don't need to "list" the total of operations. However, in order to load deposits, our best option
    // is to use limit/skip and keep querying until less entities than the $limit are returned.
    // See https://github.com/graphprotocol/graph-node/issues/613 and
    // https://github.com/graphprotocol/graph-node/issues/1309
    await pDoWhilst(
      async function ({
        limit,
        skip,
      }: {
        limit: number
        skip: number
        withdrawals: ToEvmWithdrawOperation[]
      }) {
        // Getting the status of withdrawals is a very expensive operation.
        // In order to prevent the sync to take a long time, I am on purpose not loading the state
        // and saving these withdrawals. This way, the table will show all the information available (Everything, but the status)
        // and a "Loading" box for the status. Then, the watchers have the logic to retrieve the status missing. This way, the whole
        // sync process feels faster to the user.
        const newWithdrawals = await getEvmWithdrawals({
          address,
          chainId: l2Chain.id,
          // from the oldest block we've queried before
          fromBlock,
          limit,
          skip,
        })

        saveHistory({
          payload: {
            chainId: l1Chain.id,
            chunkIndex: shouldQueryWithdrawals(limit, newWithdrawals.length)
              ? skip
              : 0,
            content: newWithdrawals,
            // only update the "fromBlock" if we have finished querying all withdrawals. Otherwise
            // we may miss some withdrawals. Once all were loaded, and saved in local storage, next time
            // we can start querying again from the current last indexed block of the subgraph
            fromBlock: shouldQueryWithdrawals(limit, newWithdrawals.length)
              ? fromBlock
              : lastIndexedBlock + 1,
            // TODO once feature flag is removed, these fields are no longer needed.
            // See https://github.com/hemilabs/ui-monorepo/issues/743
            hasSyncToMinBlock: true,
            toBlock: undefined,
          },
          type: 'sync-withdrawals',
        })

        return {
          limit,
          skip: skip + limit,
          withdrawals: newWithdrawals,
        }
      },
      ({ limit, withdrawals }) =>
        shouldQueryWithdrawals(limit, withdrawals.length),
      {
        limit: withdrawalsPageSize,
        skip: withdrawalsSyncInfo.chunkIndex ?? 0,
        withdrawals: [],
      },
    )
  }

  const syncWithdrawals = (
    chainProvider: BaseProvider,
    crossChainMessengerPromise: Promise<CrossChainMessengerProxy>,
  ) =>
    featureFlags.syncHistoryWithdrawalsWithSubgraph
      ? syncWithdrawalsWithSubgraph()
      : syncWithdrawalsWithOpSdk(chainProvider, crossChainMessengerPromise)

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
