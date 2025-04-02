import { EventEmitter } from 'events'
import {
  Address,
  Chain,
  ChainContract,
  Hash,
  isAddress,
  PublicClient,
} from 'viem'

import { DepositEvents } from './types'

type DefaultEventMap = [never]
type EventMap<T> = Record<keyof T, unknown[]> | DefaultEventMap

/**
 * Converts a function that accepts an event emitter and returns a promise into
 * a "promise event" object, which exposes the promise and the event emitter, both
 * in a sync fashion.
 */
export const toPromiseEvent = function <
  T extends EventMap<T> = DefaultEventMap,
>(callback: (emitter: EventEmitter<T>) => Promise<void>) {
  const emitter = new EventEmitter<T>()

  // eslint-disable-next-line promise/no-callback-in-promise
  const promise = Promise.resolve().then(() => callback(emitter))

  return { emitter, promise }
}

export const getL1StandardBridgeAddress = function ({
  l1Chain,
  l2Chain,
}: {
  l1Chain: Chain
  l2Chain: Chain
}) {
  const l1StandardBridge = (
    l2Chain.contracts?.l1StandardBridge as {
      [sourceId: number]: ChainContract
    }
  )?.[l1Chain.id].address as Address | undefined
  if (!l1StandardBridge) {
    throw new Error(
      `Chain ${l2Chain.id} is missing L1StandardBridge contract for source chain ${l1Chain.id}`,
    )
  }
  return l1StandardBridge
}

export const handleWaitDeposit = async function <T extends DepositEvents>({
  emitter,
  hash,
  publicClient,
}: {
  emitter: EventEmitter<EventMap<T>>
  hash: Hash | undefined | void
  publicClient: PublicClient
}) {
  if (!hash) {
    return
  }

  emitter.emit('user-signed-deposit', hash)

  const depositReceipt = await publicClient
    .waitForTransactionReceipt({
      hash,
    })
    .catch(function (err) {
      emitter.emit('deposit-failed', err)
    })
  if (!depositReceipt) {
    return
  }

  emitter.emit(
    depositReceipt.status === 'success'
      ? 'deposit-transaction-succeeded'
      : 'deposit-transaction-reverted',
    depositReceipt,
  )
}

export const validateInputs = function ({
  account,
  amount,
  l1Chain,
  l2Chain,
}: {
  account: Address
  amount: bigint
  l1Chain: Chain
  l2Chain: Chain
}) {
  if (!isAddress(account)) {
    return { canDeposit: false, reason: 'account is not a valid address' }
  }
  if (typeof amount !== 'bigint') {
    return { canDeposit: false, reason: 'amount is not a bigint' }
  }
  if (amount <= BigInt(0)) {
    return { canDeposit: false, reason: 'amount is not greater than 0' }
  }
  if (l1Chain.id === l2Chain.id) {
    return { canDeposit: false, reason: 'l1 and l2 chains are the same' }
  }
  return undefined
}
