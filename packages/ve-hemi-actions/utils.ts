import { EventEmitter } from 'events'
import type { Address, TransactionReceipt } from 'viem'
import { isAddress, parseEventLogs, zeroAddress } from 'viem'

import { veHemiAbi } from './abi'
import {
  MaxLockDurationSeconds,
  MinLockDurationSeconds,
  SupportedChains,
} from './constants'

const validateCommonInputs = function ({
  account,
  amount,
  approvalAmount = amount,
  chainId,
}: {
  account: Address
  amount: bigint
  approvalAmount?: bigint
  chainId: number
}) {
  if (!isAddress(account)) {
    return 'account is not a valid address'
  }

  if (account === zeroAddress) {
    return 'account cannot be zero address'
  }

  if (amount === BigInt(0)) {
    return 'amount cannot be zero'
  }

  if (amount < BigInt(0)) {
    return 'amount cannot be negative'
  }

  if (approvalAmount < amount) {
    return 'approval amount cannot be less than amount'
  }

  const isSupportedChain = SupportedChains.includes(chainId)
  if (!isSupportedChain) {
    return 'chain is not supported'
  }

  return undefined
}

export const validateCreateLockInputs = function ({
  account,
  amount,
  approvalAmount = amount,
  chainId,
  lockDurationInSeconds,
}: {
  account: Address
  amount: bigint
  approvalAmount?: bigint
  chainId: number
  lockDurationInSeconds: number
}) {
  const commonError = validateCommonInputs({
    account,
    amount,
    approvalAmount,
    chainId,
  })
  if (commonError) {
    return commonError
  }

  if (lockDurationInSeconds < MinLockDurationSeconds) {
    return 'lock duration is too short'
  }

  if (lockDurationInSeconds > MaxLockDurationSeconds) {
    return 'lock duration is too long (maximum 4 years)'
  }

  return undefined
}

export const validateIncreaseAmountInputs = function ({
  account,
  additionalAmount,
  approvalAdditionalAmount = additionalAmount,
  chainId,
  tokenId,
}: {
  account: Address
  additionalAmount: bigint
  approvalAdditionalAmount?: bigint
  chainId: number
  tokenId: bigint
}) {
  const commonError = validateCommonInputs({
    account,
    amount: additionalAmount,
    approvalAmount: approvalAdditionalAmount,
    chainId,
  })
  if (commonError) {
    return commonError
  }

  if (tokenId <= BigInt(0)) {
    return 'invalid token ID'
  }

  return undefined
}

export const toPromiseEvent = function <T extends Record<string, unknown[]>>(
  fn: (emitter: EventEmitter<T>) => Promise<void>,
): {
  emitter: EventEmitter<T>
  promise: Promise<void>
} {
  const emitter = new EventEmitter<T>()
  const promise = fn(emitter)
  return { emitter, promise }
}

type VeHemiLockEvent = {
  lockDuration: bigint
  tokenId: bigint
  ts: bigint
}

export const getLockEvent = (receipt: TransactionReceipt) =>
  parseEventLogs({ abi: veHemiAbi, logs: receipt.logs }).find(
    event => event.eventName === 'Lock',
  )?.args as VeHemiLockEvent | undefined
