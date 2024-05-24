'use client'

import { CrossChainMessenger, TokenBridgeMessage } from '@eth-optimism/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { getBlock } from '@wagmi/core'
import { getWalletConfig } from 'app/context/walletContext'
import { bridgeableNetworks, hemi } from 'app/networks'
import { useConnectedChainCrossChainMessenger } from 'hooks/useL2Bridge'
import { usePathname } from 'next/navigation'
import pAll from 'p-all'
import pThrottle from 'p-throttle'
import pMemoize from 'promise-mem'
import { createContext, useCallback, useMemo, ReactNode } from 'react'
import {
  type SyncState,
  type SyncStatus,
  useSyncInBlockChunks,
} from 'ui-common/hooks/useSyncInBlockChunks'
import { type Address, type Chain } from 'viem'
import { sepolia } from 'viem/chains'
import { useAccount, useBlockNumber } from 'wagmi'

// When requesting data per deposit/withdraw, do not request more than 5 per type at a time.
const concurrency = 5

const chainConfiguration = {
  [hemi.id]: {
    blockWindowSize: 7000, // Approximately 1 day
  },
  [sepolia.id]: {
    blockWindowSize: 7000, // Approximately 1 day
    minBlockToSync: 5_294_649, // Approximately hemi testnet birth.
  },
}

const getTunnelHistoryDepositStorageKey = (
  l1ChainId: Chain['id'],
  address: Address,
) => `portal.transaction-history-L1-${l1ChainId}-${address}-deposits`

const getTunnelHistoryWithdrawStorageKey = (
  l2ChainId: number,
  address: Address,
) => `portal.transaction-history-L2-${l2ChainId}-${address}-deposits`

export type TunnelOperation = Omit<TokenBridgeMessage, 'amount'> & {
  amount: string
  timestamp: number
}

type TunnelHistoryContext = {
  addDepositToTunnelHistory: (
    deposit: Omit<TunnelOperation, 'timestamp'>,
  ) => Promise<void>
  addWithdrawalToTunnelHistory: (
    deposit: Omit<TunnelOperation, 'timestamp'>,
  ) => Promise<void>
  deposits: TunnelOperation[]
  depositSyncStatus: SyncStatus
  resumeSync: () => void
  withdrawSyncStatus: SyncStatus
  withdrawals: TunnelOperation[]
}

export const TunnelHistoryContext = createContext<TunnelHistoryContext>({
  addDepositToTunnelHistory: () => undefined,
  addWithdrawalToTunnelHistory: () => undefined,
  deposits: [],
  depositSyncStatus: 'syncing',
  resumeSync: () => undefined,
  withdrawals: [],
  withdrawSyncStatus: 'syncing',
})

const pGetBlock = pMemoize(
  (blockNumber: TunnelOperation['blockNumber'], chainId: Chain['id']) =>
    getBlock(getWalletConfig(), {
      blockNumber: BigInt(blockNumber),
      chainId,
    }),
  { resolver: (blockNumber, chainId) => `${blockNumber}-${chainId}` },
)

const addTimestampToOperation = (
  operation: Omit<TunnelOperation, 'timestamp'>,
  chainId: Chain['id'],
) =>
  pGetBlock(operation.blockNumber, chainId).then(blockNumber => ({
    ...operation,
    timestamp: Number(blockNumber.timestamp),
  }))

const removeDuplicates = (operations: TunnelOperation[]) =>
  Array.from(
    new Set(operations.map(({ transactionHash }) => transactionHash)),
  ).map(transactionHash =>
    operations.find(operation => operation.transactionHash === transactionHash),
  )

const mergeContent = function (
  previousContent: TunnelOperation[],
  newContent: TunnelOperation[],
) {
  const merged = previousContent.concat(newContent)
  return removeDuplicates(merged).sort((a, b) => b.timestamp - a.timestamp)
}

const getDeposits = pThrottle({ interval: 1000, limit: 2 })(
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
    crossChainMessenger.getDepositsByAddress(address, {
      fromBlock,
      toBlock,
    }),
)

const getWithdrawals = pThrottle({ interval: 1000, limit: 2 })(
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
    crossChainMessenger.getWithdrawalsByAddress(address, {
      fromBlock,
      toBlock,
    }),
)

const useSyncTunnelOperations = function ({
  chainId,
  l1ChainId,
  getStorageKey,
  getTunnelOperations,
}: {
  chainId: Chain['id']
  l1ChainId: Chain['id']
  getStorageKey:
    | typeof getTunnelHistoryDepositStorageKey
    | typeof getTunnelHistoryWithdrawStorageKey
  getTunnelOperations: typeof getDeposits | typeof getWithdrawals
}) {
  const { address } = useAccount()

  const isTransactionHistoryPage = usePathname().endsWith(
    'transaction-history/',
  )

  const { data: lastBlockNumber, queryKey } = useBlockNumber({
    chainId,
    query: {
      refetchOnMount: 'always',
    },
  })

  const storageKey = getStorageKey(chainId, address)

  const queryClient = useQueryClient()

  const { crossChainMessenger, crossChainMessengerStatus } =
    useConnectedChainCrossChainMessenger(l1ChainId)

  const syncBlockWindow = useCallback(
    (fromBlock: number, toBlock: number) =>
      getTunnelOperations({
        address,
        crossChainMessenger,
        fromBlock,
        toBlock,
      }).then(operations =>
        pAll(
          operations.map(
            operation => () =>
              addTimestampToOperation(
                {
                  ...operation,
                  // convert these types to something that we can serialize
                  amount: operation.amount.toString(),
                },
                chainId,
              ),
          ),
          { concurrency },
        ),
      ),
    [address, chainId, crossChainMessenger, getTunnelOperations],
  )

  const state = useSyncInBlockChunks<TunnelOperation>({
    ...chainConfiguration[chainId],
    chainId,
    enabled:
      crossChainMessengerStatus === 'success' &&
      // only sync while in the Transaction History page
      isTransactionHistoryPage,
    lastBlockNumber:
      lastBlockNumber !== undefined ? Number(lastBlockNumber) : undefined,
    mergeContent,
    storageKey,
    syncBlockWindow,
  })

  // Use this function to add an operation to the local storage
  // from outside of the automatic sync process.
  const addOperationToTunnelHistory = useCallback(
    async function (operation: Omit<TunnelOperation, 'timestamp'>) {
      if (state.syncBlock.hasSyncToMinBlock) {
        // This means that we have walked through the whole blockchain history
        // up to minBlockToSync. So we don't need to manually add it
        // as syncing will automatically pick it up.
        return undefined
      }

      // Here our app it is walking through the history way back, so new operations
      // may take a while to appear, because it is still syncing previous blocks
      // and won't check for recent blocks until finishes that process
      // This will cause that recent operations don't appear in the tx history, which
      // is bad for the user experience.
      // So we can manually add them to local storage, without changing the rest
      // if in the future it re-syncs and gets duplicated, the code in "mergeContent"
      // will automatically discard it.

      const stringItem = localStorage.getItem(storageKey)
      if (!stringItem) {
        // if nothing is saved, it means that we have never entered the tx history page before
        // so once we enter it will automatically sync and pick up the new operation.
        // starting from the newest block and going back
        // Nothing to do here then.
        return undefined
      }
      const item: SyncState<TunnelOperation> = JSON.parse(stringItem)
      // add the new operation, and update local storage.
      // It should resync automatically on the state once we enter the tx-history page
      return addTimestampToOperation(operation, chainId).then(
        function (updatedOperation) {
          item.content = mergeContent(item.content, [updatedOperation])
          localStorage.setItem(storageKey, JSON.stringify(item))
        },
      )
    },
    [chainId, state, storageKey],
  )

  return useMemo(
    () => ({
      addOperationToTunnelHistory,
      operations: state.syncBlock.content,
      resumeSync() {
        queryClient.invalidateQueries({ queryKey })
        state.resumeSync()
      },
      syncStatus: state.syncStatus,
    }),
    [addOperationToTunnelHistory, state, queryClient, queryKey],
  )
}

type Props = {
  children: ReactNode
}

export const TunnelHistoryProvider = function ({ children }: Props) {
  // TODO https://github.com/BVM-priv/ui-monorepo/issues/158
  const l1ChainId = bridgeableNetworks[0].id

  const depositState = useSyncTunnelOperations({
    chainId: l1ChainId,
    getStorageKey: getTunnelHistoryDepositStorageKey,
    getTunnelOperations: getDeposits,
    l1ChainId,
  })

  const withdrawalsState = useSyncTunnelOperations({
    chainId: hemi.id,
    getStorageKey: getTunnelHistoryWithdrawStorageKey,
    getTunnelOperations: getWithdrawals,
    l1ChainId,
  })

  const value = useMemo(
    () => ({
      addDepositToTunnelHistory: depositState.addOperationToTunnelHistory,
      addWithdrawalToTunnelHistory:
        withdrawalsState.addOperationToTunnelHistory,
      deposits: depositState.operations,
      depositSyncStatus: depositState.syncStatus,
      resumeSync() {
        depositState.resumeSync()
        withdrawalsState.resumeSync()
      },
      withdrawals: withdrawalsState.operations,
      withdrawSyncStatus: withdrawalsState.syncStatus,
    }),
    [depositState, withdrawalsState],
  )

  return (
    <TunnelHistoryContext.Provider value={value}>
      {children}
    </TunnelHistoryContext.Provider>
  )
}
