import {
  createEthRpcCache,
  perBlockStrategy,
  permanentStrategy,
} from 'eth-rpc-cache'
import { OrderedChains } from 'types/chain'
import { withdrawalsStrategy } from 'utils/cacheStrategies'
import { type Chain, fallback, http, type HttpTransport } from 'viem'

const createHttpClient = function (
  ...parameters: Parameters<typeof http>
): HttpTransport {
  const transport = http(...parameters)

  return function (
    ...args: Parameters<HttpTransport>
  ): ReturnType<HttpTransport> {
    const { request, ...rest } = transport(...args)
    // http's transport.request expects 1 argument, being ({ method, params })
    // However, the eth-rpc-cache's request function expects 2 arguments, being (method, params)
    // So the function returned below (at the end of createHttpClient's function) converts from the object to 2 parameters
    // and then, the function here below, converts it again into an object as viem's transport expects it.
    const cachedRequest = createEthRpcCache(
      (method, params) => request({ method, params }),
      {
        strategies: [perBlockStrategy, permanentStrategy, withdrawalsStrategy],
      },
    )
    return {
      // viem uses "unknown" for params, but eth-rpc-cache uses "unknown[]". While initially I thought "unknown" made more sense
      // the EIP-1993 spec uses "unknown[]" https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#request
      // so for the time being I'll keep it like that.
      // @ts-expect-error mismatch between viem and eth-rpc-cache
      request: ({ method, params }) => cachedRequest(method, params),
      ...rest,
    }
  }
}

export const buildTransport = function (network: Chain) {
  const httpConfig = {
    batch: { batchSize: 3, wait: 1000 },
    retryCount: 2,
  }
  const rpcUrls = network.rpcUrls.default.http
  if (rpcUrls.length > 1) {
    return fallback(
      rpcUrls.map(rpcUrl => createHttpClient(rpcUrl, httpConfig), {
        // rank every 30 seconds
        rank: { interval: 30_000 },
        retryCount: 1,
      }),
    )
  }
  return createHttpClient(rpcUrls[0], httpConfig)
}

export const buildTransports = (networks: Chain[] | OrderedChains) =>
  Object.fromEntries(networks.map(n => [n.id, buildTransport(n)]))
