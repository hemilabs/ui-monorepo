'use strict'

const pLimitOne = require('promise-limit-one')
const pMemoize = require('promise-mem')
const pSwr = require('promise-swr')
const safeAsyncFn = require('safe-async-fn')

function getSafeCachedFn(fn, options) {
  const cachedFn = options.revalidate
    ? pSwr(fn, options)
    : options.maxAge
      ? pMemoize(fn, options)
      : pLimitOne(fn)
  // @ts-ignore ts(2345)
  return safeAsyncFn(cachedFn)
}

function toJsonMiddleware(fn, options = {}) {
  const wrapped = getSafeCachedFn(fn, options)
  return async function (req, res) {
    const [err, data] = await wrapped(...Object.values(req.params))
    if (err) {
      console.error(`Failed to handle request: ${err.stack}`)
      res.status(500).json({ error: 'Internal Server Error' })
    } else {
      res.status(200).json(data)
    }
  }
}

function toTextMiddleware(fn, options = {}) {
  const wrapped = getSafeCachedFn(fn, options)
  return async function (req, res) {
    const [err, data] = await wrapped(...Object.values(req.params))
    if (err) {
      console.error(`Failed to handle request: ${err.stack}`)
      res.status(500).type('text').send('Internal Server Error')
    } else {
      res.status(200).type('text').send(data.toString())
    }
  }
}

module.exports = {
  toJsonMiddleware,
  toTextMiddleware,
}
