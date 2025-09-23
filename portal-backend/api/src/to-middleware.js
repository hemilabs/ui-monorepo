'use strict'

const pLimitOne = require('promise-limit-one')
const pMemoize = require('promise-mem')
const pSwr = require('promise-swr')
const safeAsyncFn = require('safe-async-fn')

function toMiddleware(fn, options = {}) {
  const cachedFn = options.revalidate
    ? pSwr(fn, options)
    : options.maxAge
      ? pMemoize(fn, options)
      : pLimitOne(fn)
  // @ts-ignore ts(2345)
  const safeFn = safeAsyncFn(cachedFn)
  return async function (req, res) {
    const [err, data] = await safeFn(...Object.values(req.params))
    if (err) {
      console.error(`Failed to handle request: ${err}`)
      res.status(500).json({ error: 'Internal Server Error' })
    } else {
      res.status(200).json(data)
    }
  }
}

module.exports = toMiddleware
