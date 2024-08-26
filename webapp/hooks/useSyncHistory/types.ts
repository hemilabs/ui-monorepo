import { BtcTransaction } from 'btc-wallet/unisat'
import { type RemoteChain } from 'types/chain'
import {
  type DepositTunnelOperation,
  type TunnelOperation,
  type WithdrawTunnelOperation,
} from 'types/tunnel'
import {
  type DefinedFields,
  type NoPayload,
  type Payload,
} from 'utils/typeUtilities'

export type BlockSyncType = {
  chunkIndex: number
  fromBlock: number
  hasSyncToMinBlock: boolean
  toBlock: number | undefined
}

export type TransactionListSyncType = {
  fromKnownTx: BtcTransaction | undefined
  hasSyncToMinTx: boolean
  toKnownTx: BtcTransaction | undefined
  txPivot: BtcTransaction | undefined
}

export type SyncType = BlockSyncType | TransactionListSyncType
export type SyncStatus = 'idle' | 'ready' | 'syncing' | 'finished' | 'error'

export type StorageChain<TOperation extends TunnelOperation = TunnelOperation> =
  {
    chainId: RemoteChain['id']
    content: TOperation[]
    status: SyncStatus
  } & SyncType

type Action<T extends string> = {
  type: T
}

type AddDepositAction = Action<'add-deposit'> & Payload<DepositTunnelOperation>
type AddWithdrawAction = Action<'add-withdraw'> &
  Payload<WithdrawTunnelOperation>

type ResetAction = Action<'reset'> & NoPayload

type RestoreStateAction = Action<'restore'> &
  Payload<{
    deposits: StorageChain<DepositTunnelOperation>[]
    withdrawals: StorageChain<WithdrawTunnelOperation>[]
  }>

type SyncAction = Action<'sync'> & Payload<{ chainId: RemoteChain['id'] }>

export type SyncContentPayload<
  TOperation extends TunnelOperation,
  TSyncType extends SyncType,
> = {
  chainId: RemoteChain['id']
  content: TOperation[]
} & DefinedFields<TSyncType>

export type SyncDepositsAction<
  TOperation extends DepositTunnelOperation = DepositTunnelOperation,
  TSyncType extends SyncType = SyncType,
> = Action<'sync-deposits'> & Payload<SyncContentPayload<TOperation, TSyncType>>

export type SyncFinished = Action<'sync-finished'> &
  Payload<{ chainId: RemoteChain['id'] }>

export type SyncWithdrawalsAction<
  TOperation extends WithdrawTunnelOperation = WithdrawTunnelOperation,
  TSyncType extends SyncType = SyncType,
> = Action<'sync-withdrawals'> &
  Payload<SyncContentPayload<TOperation, TSyncType>>

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
  | SyncFinished
  | SyncWithdrawalsAction
  | UpdateDepositAction
  | UpdateWithdrawAction

export type HistoryReducerState = {
  deposits: StorageChain<DepositTunnelOperation>[]
  status: SyncStatus
  withdrawals: StorageChain<WithdrawTunnelOperation>[]
}
