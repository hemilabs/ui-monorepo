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
    const [err, data] = await safeFn(...req.params)
    let statusCode, response
    if (err) {
      console.error(`Failed to handle request: ${err}`)
      statusCode = 500
      response = { error: 'Internal Server Error' }
    } else {
      statusCode = 200
      response = data
    }
    res.writeHead(statusCode, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(response))
  }
}

module.exports = toMiddleware
