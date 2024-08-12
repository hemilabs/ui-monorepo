import { type RemoteChain } from 'app/networks'
import {
  type DepositTunnelOperation,
  type TunnelOperation,
  type WithdrawTunnelOperation,
} from 'types/tunnel'

export type StorageChain<T extends TunnelOperation = TunnelOperation> = {
  chainId: RemoteChain['id']
  chunkIndex: number
  content: T[]
  fromBlock: number
  hasSyncToMinBlock: boolean
  toBlock: number | undefined
}

type Action<T extends string> = {
  type: T
}
type NoPayload = { payload?: never }
type Payload<T> = { payload: T }

type AddDepositAction = Action<'add-deposit'> & Payload<DepositTunnelOperation>
type AddWithdrawAction = Action<'add-withdraw'> &
  Payload<WithdrawTunnelOperation>

type ResetAction = Action<'reset'> & NoPayload

type RestoreStateAction = Action<'restore'> &
  Payload<{
    deposits: StorageChain<DepositTunnelOperation>[]
    withdrawals: StorageChain<WithdrawTunnelOperation>[]
  }>

type SyncAction = Action<'sync'> & NoPayload

export type SyncContentPayload<T extends TunnelOperation> = {
  chainId: RemoteChain['id']
  chunkIndex: number
  content: T[]
  hasSyncToMinBlock: boolean
  fromBlock: number
  toBlock: number
}

type SyncDepositsAction = Action<'sync-deposits'> &
  Payload<SyncContentPayload<DepositTunnelOperation>>

type SyncWithdrawalsAction = Action<'sync-withdrawals'> &
  Payload<SyncContentPayload<WithdrawTunnelOperation>>

type UpdateDepositAction = Action<'update-deposit'> &
  Payload<{
    deposit: DepositTunnelOperation
    updates: Partial<DepositTunnelOperation>
  }>

type UpdateWithdrawAction = Action<'update-withdraw'> &
  Payload<{
    updates: Partial<WithdrawTunnelOperation>
    withdraw: WithdrawTunnelOperation
  }>

export type HistoryActions =
  | AddDepositAction
  | AddWithdrawAction
  | ResetAction
  | RestoreStateAction
  | SyncAction
  | SyncDepositsAction
  | SyncWithdrawalsAction
  | UpdateDepositAction
  | UpdateWithdrawAction

export type HistoryReducerState = {
  deposits: StorageChain<DepositTunnelOperation>[]
  status: 'idle' | 'ready' | 'syncing' | 'finished' | 'error'
  withdrawals: StorageChain<WithdrawTunnelOperation>[]
}
