import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import {
  createEthRpcCache,
  perBlockStrategy,
  permanentStrategy,
} from 'eth-rpc-cache'

export const cacheProvider = function <
  T extends JsonRpcProvider | Web3Provider,
>(provider: T, strategies: (typeof permanentStrategy)[] = []) {
  const cached = createEthRpcCache(
    (method, params) => provider.send(method, params),
    { strategies: [perBlockStrategy, permanentStrategy, ...strategies] },
  )
  const newProvider: T = {
    ...provider,
    send: (method, params) => cached(method, params),
  }
  Object.setPrototypeOf(newProvider, Object.getPrototypeOf(provider))
  return newProvider
}
