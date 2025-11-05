import { EventEmitter } from 'events'

type DefaultEventMap = [never]
type EventMap<T> = Record<keyof T, unknown[]> | DefaultEventMap

/**
 * Converts a function that accepts an event emitter and returns a promise into
 * a "promise event" object, which exposes the promise and the event emitter, both
 * in a sync fashion.
 */
export const toPromiseEvent = function <
  T extends EventMap<T> = DefaultEventMap,
>(
  callback: (emitter: EventEmitter<T>) => Promise<void>,
): {
  emitter: EventEmitter<T>
  promise: Promise<void>
} {
  const emitter = new EventEmitter<T>()
  // Let's ensure the error is handled as a Promise rejection
  // eslint-disable-next-line promise/no-callback-in-promise
  const promise = Promise.resolve().then(() => callback(emitter))

  return { emitter, promise }
}
