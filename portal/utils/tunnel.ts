import {
  type BtcDepositOperation,
  BtcDepositStatus,
  BtcWithdrawStatus,
  type DepositTunnelOperation,
  type EvmDepositOperation,
  EvmDepositStatus,
  MessageDirection,
  MessageStatus,
  type MessageStatusType,
  type ToBtcWithdrawOperation,
  type ToEvmWithdrawOperation,
  type TunnelOperation,
  type WithdrawTunnelOperation,
} from 'types/tunnel'
import { Chain, PublicClient, type TransactionReceipt } from 'viem'
import {
  GetWithdrawalStatusReturnType,
  getWithdrawalStatus,
} from 'viem/op-stack'

import { findChainById } from './chain'

// The portal works with the old MessageStatus from the @eth-optimism/sdk
// so we must map the new status to the old one. See definition of MessageStatus
// here https://sdk.optimism.io/enums/messagestatus
const mapStatusToOpMessageStatus = function (
  status: GetWithdrawalStatusReturnType,
): MessageStatusType {
  switch (status) {
    case 'finalized':
      return MessageStatus.RELAYED
    case 'ready-to-finalize':
      return MessageStatus.READY_FOR_RELAY
    case 'ready-to-prove':
      return MessageStatus.READY_TO_PROVE
    case 'waiting-to-finalize':
      return MessageStatus.IN_CHALLENGE_PERIOD
    case 'waiting-to-prove':
      return MessageStatus.STATE_ROOT_NOT_PUBLISHED
    default:
      throw new Error(`Unexpected withdrawal status ${status}`)
  }
}

export const getEvmWithdrawalStatus = async function ({
  l1publicClient,
  l2ChainId,
  receipt,
}: {
  l1publicClient: PublicClient
  l2ChainId: Chain['id']
  receipt: TransactionReceipt
}) {
  if (receipt.status === 'reverted') {
    return MessageStatus.FAILED_L1_TO_L2_MESSAGE
  }
  return getWithdrawalStatus(l1publicClient, {
    chain: l1publicClient.chain,
    receipt,
    // @ts-expect-error Can't make the viem types to work. This works on runtime
    targetChain: findChainById(l2ChainId),
  }).then(mapStatusToOpMessageStatus)
}

export const isDeposit = (
  operation: TunnelOperation,
): operation is DepositTunnelOperation =>
  operation.direction === MessageDirection.L1_TO_L2

export const isBtcOperation = (operation: TunnelOperation) =>
  typeof operation.l1ChainId === 'string'

export const isEvmOperation = (operation: TunnelOperation) =>
  typeof operation.l1ChainId === 'number'

export const isBtcDeposit = (
  operation: DepositTunnelOperation,
): operation is BtcDepositOperation => isBtcOperation(operation)

export const isEvmDeposit = (
  operation: DepositTunnelOperation,
): operation is EvmDepositOperation => isEvmOperation(operation)

export const isWithdraw = (
  operation: TunnelOperation,
): operation is WithdrawTunnelOperation =>
  operation.direction === MessageDirection.L2_TO_L1

export const isToBtcWithdraw = (
  withdraw: WithdrawTunnelOperation,
): withdraw is ToBtcWithdrawOperation => isBtcOperation(withdraw)

export const isToEvmWithdraw = (
  withdraw: WithdrawTunnelOperation,
): withdraw is ToEvmWithdrawOperation => isEvmOperation(withdraw)

const btcDepositCompletedActions = [
  BtcDepositStatus.BTC_DEPOSITED,
  BtcDepositStatus.BTC_DEPOSITED_MANUALLY,
  BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMATION_TX_FAILED,
]

const btcWithdrawCompletedActions = [
  BtcWithdrawStatus.WITHDRAWAL_FAILED,
  BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED,
  BtcWithdrawStatus.WITHDRAWAL_CHALLENGED,
  BtcWithdrawStatus.CHALLENGE_FAILED,
]

const evmDepositCompletedActions = [
  EvmDepositStatus.DEPOSIT_RELAYED,
  EvmDepositStatus.DEPOSIT_TX_FAILED,
]

const evmWithdrawCompletedActions: MessageStatusType[] = [MessageStatus.RELAYED]

const isDepositPendingOperation = function (
  operation: DepositTunnelOperation,
): boolean {
  if (isBtcDeposit(operation)) {
    return !btcDepositCompletedActions.includes(operation.status)
  }
  // @ts-expect-error includes() accepts undefined, and operation.status may not be defined
  return !evmDepositCompletedActions.includes(operation.status)
}

const isWithdrawPendingOperation = function (
  operation: WithdrawTunnelOperation,
): boolean {
  if (isToEvmWithdraw(operation)) {
    return !evmWithdrawCompletedActions.includes(operation.status)
  }

  return !btcWithdrawCompletedActions.includes(operation.status)
}

export const isPendingOperation = function (
  operation: TunnelOperation,
): boolean {
  if (isDeposit(operation)) {
    return isDepositPendingOperation(operation)
  }

  return isWithdrawPendingOperation(operation)
}

export const isMissingProveTransaction = (withdrawal: ToEvmWithdrawOperation) =>
  [
    MessageStatus.IN_CHALLENGE_PERIOD,
    MessageStatus.READY_FOR_RELAY,
    MessageStatus.RELAYED,
  ].includes(withdrawal.status) && !withdrawal.proveTxHash

export const isMissingClaimTransaction = (withdrawal: ToEvmWithdrawOperation) =>
  withdrawal.status === MessageStatus.RELAYED && !withdrawal.claimTxHash

export const isWithdrawalMissingInformation = (
  withdrawal: ToEvmWithdrawOperation,
) =>
  !withdrawal.timestamp ||
  withdrawal.status === undefined ||
  isMissingProveTransaction(withdrawal) ||
  isMissingClaimTransaction(withdrawal)
