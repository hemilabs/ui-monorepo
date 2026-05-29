import type { RequestHandler } from 'express'
import pMemoize from 'promise-mem'
import pSwr from 'promise-swr'
import safeAsyncFn from 'safe-async-fn'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyAsyncFn = (...args: any[]) => Promise<any>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Resolver = (...args: any[]) => string

// A caching strategy must be chosen explicitly (passing no option is not
// allowed): either stale-while-revalidate (`revalidate`), or memoize for
// `maxAge` ms. In the memoize form the `maxAge` key is required, but its value
// may be `undefined` to opt into caching forever; `maxAge: 0` means no caching
// (just in-flight de-duplication of concurrent identical calls). Both key by
// `resolver` (defaults to the first argument).
type CacheOptions =
  | { revalidate: number; maxAge?: number; resolver?: Resolver }
  | { revalidate?: undefined; maxAge: number | undefined; resolver?: Resolver }

function getSafeCachedFn(fn: AnyAsyncFn, options: CacheOptions) {
  // A present `maxAge` is passed through as-is — promise-mem treats `undefined`
  // as Infinity, which is the explicit "cache forever" opt-in. Only a missing
  // key defaults to 0 (no caching), never promise-mem's implicit Infinity.
  const cachedFn = options.revalidate
    ? pSwr(fn, options)
    : pMemoize(fn, 'maxAge' in options ? options : { ...options, maxAge: 0 })
  return safeAsyncFn(cachedFn)
}

function toJsonMiddleware(
  fn: AnyAsyncFn,
  options: CacheOptions,
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
  options: CacheOptions,
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
