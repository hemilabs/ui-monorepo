'use client'

import { TokenBridgeMessage, toNumber } from '@eth-optimism/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { getBlock } from '@wagmi/core'
import { getWalletConfig } from 'app/context/walletContext'
import { bridgeableNetworks, hemi } from 'app/networks'
import { useConnectedChainCrossChainMessenger } from 'hooks/useL2Bridge'
import { usePathname } from 'next/navigation'
import pAll from 'p-all'
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
    minBlockToSync: 5294649, // Approximately hemi testnet birth.
  },
}

const getTunnelHistoryDepositStorageKey = (
  l1ChainId: Chain['id'],
  address: Address,
) => `portal.transaction-history-L1-${l1ChainId}-${address}-deposits`

export type TunnelOperation = Omit<TokenBridgeMessage, 'amount'> & {
  amount: string
  timestamp: number
}

type TunnelHistoryContext = {
  addDepositToTunnelHistory: (
    deposit: Omit<TunnelOperation, 'timestamp'>,
  ) => Promise<void>
  deposits: TunnelOperation[]
  depositSyncStatus: SyncStatus
  resumeSync: () => void
  // withdrawSyncStatus: SyncStatus
}

export const TunnelHistoryContext = createContext<TunnelHistoryContext>({
  addDepositToTunnelHistory: () => undefined,
  deposits: [],
  depositSyncStatus: 'syncing',
  resumeSync: () => undefined,
  // withdrawSyncStatus: 'syncing',
})

const addTimestampToOperation = (
  operation: Omit<TunnelOperation, 'timestamp'>,
  chainId: Chain['id'],
) =>
  getBlock(getWalletConfig(), {
    blockNumber: BigInt(operation.blockNumber),
    chainId,
  }).then(blockNumber => ({
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
type Props = {
  children: ReactNode
}

export const TunnelHistoryProvider = function ({ children }: Props) {
  const { address } = useAccount()

  // TODO https://github.com/BVM-priv/ui-monorepo/issues/158
  const l1ChainId = bridgeableNetworks[0].id

  const isTransactionHistoryPage = usePathname().endsWith(
    'transaction-history/',
  )

  const { data: l1ChainIdLastBlockNumber, queryKey } = useBlockNumber({
    chainId: l1ChainId,
    query: {
      refetchOnMount: 'always',
    },
  })

  const queryClient = useQueryClient()

  const { crossChainMessenger, crossChainMessengerStatus } =
    useConnectedChainCrossChainMessenger(l1ChainId)

  const syncBlockWindow = (fromBlock: number, toBlock: number) =>
    crossChainMessenger
      .getDepositsByAddress(address, {
        fromBlock: toNumber(fromBlock.toString()),
        toBlock: toNumber(toBlock.toString()),
      })
      .then(deposits =>
        pAll(
          deposits.map(
            deposit => () =>
              addTimestampToOperation(
                {
                  ...deposit,
                  // convert these types to something that we can serialize
                  amount: deposit.amount.toString(),
                },
                l1ChainId,
              ),
          ),
          { concurrency },
        ),
      )

  const depositsState = useSyncInBlockChunks<TunnelOperation>({
    ...chainConfiguration[l1ChainId],
    chainId: l1ChainId,
    enabled:
      crossChainMessengerStatus === 'success' &&
      // only sync while in the Transaction History page
      isTransactionHistoryPage,
    lastBlockNumber:
      l1ChainIdLastBlockNumber !== undefined
        ? Number(l1ChainIdLastBlockNumber)
        : undefined,
    mergeContent,
    storageKey: getTunnelHistoryDepositStorageKey(l1ChainId, address),
    syncBlockWindow,
  })

  const addDepositToTunnelHistory = useCallback(
    async function (deposit: Omit<TunnelOperation, 'timestamp'>) {
      if (depositsState.syncBlock.hasSyncToMinBlock) {
        // This means that we have walked through the whole blockchain history
        // up to minBlockToSync. So we don't need to manually add it
        // as syncing will automatically pick it up.
        return undefined
      }

      // Here our app it is walking through the history way back, so new deposits
      // may take a while to appear, because it is still syncing previous blocks
      // and won't check for recent blocks until finishes that process
      // This will cause that recent operations don't appear in the tx history, which
      // is bad for the user experience.
      // So we can manually add them to local storage, without changing the rest
      // if in the future it re-syncs and gets duplicated, the code in "mergeContent"
      // will automatically discard it.

      const key = getTunnelHistoryDepositStorageKey(l1ChainId, address)
      const stringItem = localStorage.getItem(key)
      if (!stringItem) {
        // if nothing is saved, it means that we have never entered the tx history page before
        // so once we enter it will automatically sync and pick up the new deposit.
        // starting from the newest block and going back
        // Nothing to do here then.
        return undefined
      }
      const item: SyncState<TunnelOperation> = JSON.parse(stringItem)
      // add the new deposit, and update local storage.
      // It should resync automatically on the state once we enter the tx-history page
      return addTimestampToOperation(deposit, l1ChainId).then(
        function (operation) {
          item.content = mergeContent(item.content, [operation])
          localStorage.setItem(key, JSON.stringify(item))
        },
      )
    },
    [address, depositsState, l1ChainId],
  )

  const value = useMemo(
    () => ({
      addDepositToTunnelHistory,
      deposits: depositsState.syncBlock.content,
      depositSyncStatus: depositsState.syncStatus,
      resumeSync() {
        queryClient.invalidateQueries({ queryKey })
        depositsState.resumeSync()
      },
    }),
    [addDepositToTunnelHistory, depositsState, queryClient, queryKey],
  )

  return (
    <TunnelHistoryContext.Provider value={value}>
      {children}
    </TunnelHistoryContext.Provider>
  )
}
