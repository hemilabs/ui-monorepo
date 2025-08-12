import { EventEmitter } from 'events'
import type { Address } from 'viem'
import { isAddress, zeroAddress } from 'viem'

import {
  MAX_LOCK_DURATION,
  MIN_LOCK_DURATION,
  SUPPORTED_CHAINS,
} from './constants'

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
  lockDurationInSeconds: bigint
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

  if (lockDurationInSeconds < MIN_LOCK_DURATION) {
    return 'lock duration is too short'
  }

  if (lockDurationInSeconds > MAX_LOCK_DURATION) {
    return 'lock duration is too long (maximum 4 years)'
  }

  const isSupportedChain = SUPPORTED_CHAINS.includes(chainId)
  if (!isSupportedChain) {
    return 'chain is not supported'
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
