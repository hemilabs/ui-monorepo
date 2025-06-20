'use strict'

/**
 * Wraps an async function to capture all error modes making the call safe.
 *
 * @template T - The return type
 * @template {Error} [E=Error] - The error type
 * @param {function(...any): Promise<T>} asyncFn - The async function
 * @returns {function(...any): Promise<[E | null, T | null]>} A function that returns either [null, result] or [error, null]
 */
const safeAsyncFn = asyncFn =>
  async function (...args) {
    try {
      return [null, await asyncFn(...args)]
    } catch (err) {
      return [err, null]
    }
  }

module.exports = safeAsyncFn
