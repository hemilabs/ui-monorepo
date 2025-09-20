'use strict'

/**
 * @param {string} key
 * @param {string} error
 * @throws {Error}
 */
function throwOnError(key, error) {
  throw new Error(error)
}

/**
 * Like Promise.all, but for object properties. If any promise rejects, the
 * onError function is called with the key and the error, and its return value
 * is used instead.
 *
 * @param {{ [key: string]: Promise<any> }} obj
 * @param {(key: string, error: string) => any } onError
 * @returns {Promise<{ [key: string]: any }>}
 */
const promiseAllProps = (obj, onError = throwOnError) =>
  Promise.allSettled(Object.values(obj)).then(results =>
    Object.fromEntries(
      Object.keys(obj).map(function (key, i) {
        const result = results[i]
        return [
          key,
          result.status === 'fulfilled'
            ? result.value
            : onError(key, result.reason),
        ]
      }),
    ),
  )

module.exports = promiseAllProps
