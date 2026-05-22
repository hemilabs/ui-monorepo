import type { RequestHandler } from 'express'
import pLimitOne from 'promise-limit-one'
import pMemoize from 'promise-mem'
import pSwr from 'promise-swr'
import safeAsyncFn from 'safe-async-fn'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyAsyncFn = (...args: any[]) => Promise<any>

type CacheOptions = {
  maxAge?: number
  revalidate?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolver?: (...args: any[]) => string
}

function getSafeCachedFn(fn: AnyAsyncFn, options: CacheOptions) {
  const cachedFn = options.revalidate
    ? pSwr(fn, options)
    : options.maxAge
      ? pMemoize(fn, options)
      : pLimitOne(fn)
  return safeAsyncFn(cachedFn)
}

function toJsonMiddleware(
  fn: AnyAsyncFn,
  options: CacheOptions = {},
): RequestHandler {
  const wrapped = getSafeCachedFn(fn, options)
  return async function (req, res) {
    const [err, data] = await wrapped(...Object.values(req.params))
    if (err) {
      console.error(`Failed to handle request to ${req.path}: ${err.stack}`)
      res.status(500).json({ error: 'Internal Server Error' })
    } else {
      res.status(200).json(data)
    }
  }
}

function toTextMiddleware(
  fn: AnyAsyncFn,
  options: CacheOptions = {},
): RequestHandler {
  const wrapped = getSafeCachedFn(fn, options)
  return async function (req, res) {
    const [err, data] = await wrapped(...Object.values(req.params))
    if (err) {
      console.error(`Failed to handle request to ${req.path}: ${err.stack}`)
      res.status(500).type('text').send('Internal Server Error')
    } else {
      res.status(200).type('text').send(data.toString())
    }
  }
}

export { toJsonMiddleware, toTextMiddleware }
