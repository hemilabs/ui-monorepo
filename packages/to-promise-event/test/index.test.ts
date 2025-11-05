import { EventEmitter } from 'events'
import { describe, expect, it } from 'vitest'

import { toPromiseEvent } from '../index'

describe('toPromiseEvent', function () {
  it('should return an object with emitter and promise properties', function () {
    const { emitter, promise } = toPromiseEvent(async function () {})

    expect(emitter).toBeInstanceOf(EventEmitter)
    expect(promise).toBeInstanceOf(Promise)
  })

  it('should reject the promise when callback throws an error', async function () {
    const error = new Error('Async error')

    const { promise } = toPromiseEvent(async function () {
      throw error
    })

    await expect(promise).rejects.toThrow('Async error')
  })

  it('should reject the promise when callback throws synchronously', async function () {
    const error = new Error('Sync error')

    const { promise } = toPromiseEvent(function () {
      throw error
    })

    await expect(promise).rejects.toThrow('Sync error')
  })
})
