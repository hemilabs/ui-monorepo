import { EventEmitter } from 'events'
import {
  Address,
  Chain,
  ChainContract,
  Hash,
  isAddress,
  PublicClient,
} from 'viem'
import { waitForTransactionReceipt } from 'viem/actions'

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

export const getL2BridgeAddress = function ({
  l1Chain,
  l2Chain,
}: {
  l1Chain: Chain
  l2Chain: Chain
}) {
  const l2Bridge = (
    l2Chain.contracts?.l2Bridge as {
      [sourceId: number]: ChainContract
    }
  )?.[l1Chain.id].address as Address | undefined
  if (!l2Bridge) {
    throw new Error(
      `Chain ${l2Chain.id} is missing L2Bridge contract for source chain ${l1Chain.id}`,
    )
  }
  return l2Bridge
}

export const handleWaitDeposit = async function <T extends DepositEvents>({
  emitter,
  hash,
  publicClient,
}: {
  emitter: EventEmitter<EventMap<T>>
  hash: Hash
  publicClient: PublicClient
}) {
  emitter.emit('user-signed-deposit', hash)

  // Using @ts-expect-error fails to compile so I need to use @ts-ignore
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
  const depositReceipt = await waitForTransactionReceipt(publicClient, {
    hash,
  }).catch(function (err) {
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
    return 'account is not a valid address'
  }
  if (typeof amount !== 'bigint') {
    return 'amount is not a bigint'
  }
  if (amount <= BigInt(0)) {
    return 'amount is not greater than 0'
  }
  if (l1Chain.id === l2Chain.id) {
    return 'l1 and l2 chains are the same'
  }
  return undefined
}
