'use client'

import { useQueryClient } from '@tanstack/react-query'
import { featureFlags } from 'app/featureFlags'
import {
  bitcoin,
  evmRemoteNetworks,
  hemi,
  type RemoteChain,
} from 'app/networks'
import { useConnectedChainCrossChainMessenger } from 'hooks/useL2Bridge'
import dynamic from 'next/dynamic'
import { createContext, useMemo, ReactNode } from 'react'
import { type SyncStatus } from 'ui-common/hooks/useSyncInBlockChunks'
import { getBlockTipHeight } from 'utils/btcApi'
import { type Address, type Chain } from 'viem'
import { Config, useConfig } from 'wagmi'
import { getBlockNumber } from 'wagmi/actions'

import { getDeposits, getWithdrawals } from './operations'
import {
  BtcDepositOperation,
  DepositTunnelOperation,
  EvmDepositOperation,
  EvmWithdrawOperation,
} from './types'
import { useSyncTunnelOperations } from './useSyncTunnelOperations'

const BitcoinDepositsStatusUpdater = dynamic(
  () =>
    import('./bitcoinDepositsStatusUpdater').then(
      mod => mod.BitcoinDepositsStatusUpdater,
    ),
  { ssr: false },
)

const WithdrawalsStatusUpdater = dynamic(
  () =>
    import('./withdrawalsStatusUpdater').then(
      mod => mod.WithdrawalsStatusUpdater,
    ),
  { ssr: false },
)

const getTunnelHistoryDepositStorageKey = (
  l1ChainId: RemoteChain['id'],
  address: Address,
) => `portal.transaction-history-L1-${l1ChainId}-${address}-deposits`

const getTunnelHistoryWithdrawStorageKey = (
  l2ChainId: Chain['id'],
  address: Address,
) => `portal.transaction-history-L2-${l2ChainId}-${address}-withdrawals`

const getEvmBlockNumberFn = (config: Config, chainId: Chain['id']) => () =>
  getBlockNumber(config, { chainId }).then(blockNumber => Number(blockNumber))

type TunnelHistoryContext = {
  addBtcDepositToTunnelHistory: (deposit: BtcDepositOperation) => void
  addEvmDepositToTunnelHistory: (deposit: EvmDepositOperation) => void
  addWithdrawalToTunnelHistory: (
    withdrawal: Omit<EvmWithdrawOperation, 'timestamp'>,
  ) => void
  deposits: DepositTunnelOperation[]
  depositSyncStatus: SyncStatus
  resumeSync: () => void
  updateBtcDeposit: (
    deposit: BtcDepositOperation,
    updates: Partial<BtcDepositOperation>,
  ) => void
  updateWithdrawal: (
    withdrawal: EvmWithdrawOperation,
    updates: Partial<EvmWithdrawOperation>,
  ) => void
  withdrawSyncStatus: SyncStatus
  withdrawals: EvmWithdrawOperation[]
}

export const TunnelHistoryContext = createContext<TunnelHistoryContext>({
  addBtcDepositToTunnelHistory: () => undefined,
  addEvmDepositToTunnelHistory: () => undefined,
  addWithdrawalToTunnelHistory: () => undefined,
  deposits: [],
  depositSyncStatus: 'syncing',
  resumeSync: () => undefined,
  updateBtcDeposit: () => undefined,
  updateWithdrawal: () => undefined,
  withdrawals: [],
  withdrawSyncStatus: 'syncing',
})

type Props = {
  children: ReactNode
}

export const TunnelHistoryProvider = function ({ children }: Props) {
  // TODO https://github.com/BVM-priv/ui-monorepo/issues/158
  const l1ChainId = evmRemoteNetworks[0].id
  const config = useConfig()

  const queryClient = useQueryClient()

  const { crossChainMessenger, crossChainMessengerStatus } =
    useConnectedChainCrossChainMessenger(l1ChainId)

  const btcDepositState = useSyncTunnelOperations<BtcDepositOperation>({
    chainId: bitcoin.id,
    // TODO retrieve past operations https://github.com/BVM-priv/ui-monorepo/issues/345
    enabled: false,
    getBlockNumber: getBlockTipHeight,
    getStorageKey: getTunnelHistoryDepositStorageKey,
    // TODO retrieve past operations https://github.com/BVM-priv/ui-monorepo/issues/345
    getTunnelOperations: () => Promise.resolve([]),
    operationChainId: bitcoin.id,
  })

  const evmDepositState = useSyncTunnelOperations<EvmDepositOperation>({
    chainId: l1ChainId,
    enabled: crossChainMessengerStatus === 'success',
    getBlockNumber: getEvmBlockNumberFn(config, l1ChainId),
    getStorageKey: getTunnelHistoryDepositStorageKey,
    getTunnelOperations: getDeposits(crossChainMessenger),
    operationChainId: l1ChainId,
  })

  const withdrawalsState = useSyncTunnelOperations<EvmWithdrawOperation>({
    chainId: hemi.id,
    enabled: crossChainMessengerStatus === 'success',
    getBlockNumber: getEvmBlockNumberFn(config, hemi.id),
    getStorageKey: getTunnelHistoryWithdrawStorageKey,
    getTunnelOperations: getWithdrawals(crossChainMessenger),
    operationChainId: l1ChainId,
  })

  const value = useMemo(
    () => ({
      addBtcDepositToTunnelHistory: btcDepositState.addOperationToTunnelHistory,
      addEvmDepositToTunnelHistory: evmDepositState.addOperationToTunnelHistory,
      addWithdrawalToTunnelHistory:
        withdrawalsState.addOperationToTunnelHistory,
      deposits: ([] as DepositTunnelOperation[])
        .concat(evmDepositState.operations)
        .concat(
          // Adding this so in local testing, when testing with flag disabled
          // the history does not break with past operations from testing with the
          // flag enabled
          featureFlags.btcTunnelEnabled ? btcDepositState.operations : [],
        ),
      depositSyncStatus: evmDepositState.syncStatus,
      resumeSync() {
        evmDepositState.resumeSync()
        withdrawalsState.resumeSync()
      },
      updateBtcDeposit: (
        deposit: BtcDepositOperation,
        updates: Partial<BtcDepositOperation>,
      ) =>
        btcDepositState.updateOperation(function (current) {
          const newState = {
            ...current,
            content: current.content.map(o =>
              o.transactionHash === deposit.transactionHash
                ? { ...o, ...updates }
                : o,
            ),
          }
          return newState
        }),
      updateWithdrawal(
        withdrawal: EvmWithdrawOperation,
        updates: Partial<EvmWithdrawOperation>,
      ) {
        withdrawalsState.updateOperation(function (current) {
          const newState = {
            ...current,
            content: current.content.map(o =>
              o.transactionHash === withdrawal.transactionHash &&
              o.direction === withdrawal.direction
                ? { ...o, ...updates }
                : o,
            ),
          }
          return newState
        })
        if (
          updates.status !== undefined &&
          withdrawal.status !== updates.status
        ) {
          queryClient.setQueryData(
            [
              withdrawal.direction,
              l1ChainId,
              withdrawal.transactionHash,
              'getMessageStatus',
            ],
            updates.status,
          )
        }
      },
      withdrawals: withdrawalsState.operations,
      withdrawSyncStatus: withdrawalsState.syncStatus,
    }),
    [
      btcDepositState,
      evmDepositState,
      l1ChainId,
      queryClient,
      withdrawalsState,
    ],
  )

  return (
    <TunnelHistoryContext.Provider value={value}>
      {/* This could be done in a background process https://github.com/BVM-priv/ui-monorepo/issues/390 */}
      {/* Track updates on bitcoin deposits, in bitcoin or in Hemi */}
      {featureFlags.btcTunnelEnabled && <BitcoinDepositsStatusUpdater />}
      {/* Track updates on withdrawals from Hemi */}
      <WithdrawalsStatusUpdater />
      {children}
    </TunnelHistoryContext.Provider>
  )
}
