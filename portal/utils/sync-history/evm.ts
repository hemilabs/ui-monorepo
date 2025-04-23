import { BlockSyncType } from 'hooks/useSyncHistory/types'
import pDoWhilst from 'p-do-whilst'
import { EvmDepositOperation, ToEvmWithdrawOperation } from 'types/tunnel'
import {
  getEvmDeposits,
  getEvmWithdrawals,
  getLastIndexedBlock,
} from 'utils/subgraph'

import { chainConfiguration } from './chainConfiguration'
import { calculateSkip } from './common'
import { type HistorySyncer } from './types'

export const createEvmSync = function ({
  address,
  debug,
  depositsSyncInfo,
  l1Chain,
  l2Chain,
  saveHistory,
  withdrawalsSyncInfo,
}: HistorySyncer<BlockSyncType>) {
  const syncDeposits = async function () {
    // Get this before reading the Subgraph, to ensure next time we don't miss some blocks due
    // to some race condition.
    const lastIndexedBlock = await getLastIndexedBlock(l1Chain.id)

    const shouldQueryDeposits = (limit: number, depositsAmount: number) =>
      limit === depositsAmount

    const initialFromBlock =
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
        fromBlock,
        limit,
        skip,
      }: {
        fromBlock: number
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
        })

        const shouldContinue = shouldQueryDeposits(limit, newDeposits.length)
        // save the deposits
        saveHistory({
          payload: {
            chainId: l1Chain.id,
            chunkIndex: shouldContinue ? skip : 0,
            content: newDeposits,
            // only update the "fromBlock" if we have finished querying all deposits. Otherwise
            // we may miss some deposits. Once all were loaded, and saved in local storage, next time
            // we can start querying again from the current last indexed block of the subgraph
            fromBlock: shouldContinue ? fromBlock : lastIndexedBlock + 1,
          },
          type: 'sync-deposits',
        })

        return {
          deposits: newDeposits,
          fromBlock,
          limit,
          ...calculateSkip({
            limit,
            operations: newDeposits,
            skip,
          }),
        }
      },
      ({ deposits, limit }) => shouldQueryDeposits(limit, deposits.length),
      { deposits: [], fromBlock: initialFromBlock, limit: 100, skip: 0 },
    )
  }

  const syncWithdrawals = async function () {
    const withdrawalsPageSize = 100
    // Get this before reading the Subgraph, to ensure next time we don't miss some blocks due
    // to some race condition.
    const lastIndexedBlock = await getLastIndexedBlock(l2Chain.id)

    const shouldQueryWithdrawals = (limit: number, withdrawalsAmount: number) =>
      limit === withdrawalsAmount

    const initialFromBlock =
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
        fromBlock,
        limit,
        skip,
      }: {
        fromBlock: number
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
          },
          type: 'sync-withdrawals',
        })

        return {
          fromBlock,
          limit,
          withdrawals: newWithdrawals,
          ...calculateSkip({
            limit,
            operations: newWithdrawals,
            skip,
          }),
        }
      },
      ({ limit, withdrawals }) =>
        shouldQueryWithdrawals(limit, withdrawals.length),
      {
        fromBlock: initialFromBlock,
        limit: withdrawalsPageSize,
        skip: withdrawalsSyncInfo.chunkIndex ?? 0,
        withdrawals: [],
      },
    )
  }

  const syncHistory = () =>
    Promise.all([
      syncDeposits().then(() => debug('Deposits sync finished')),
      syncWithdrawals().then(() => debug('Withdrawals sync finished')),
    ]).then(function () {
      debug('Sync process finished')
    })

  return {
    syncHistory,
  }
}
