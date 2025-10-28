import { EventEmitter } from 'events'

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
