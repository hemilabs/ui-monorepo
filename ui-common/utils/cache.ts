import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import { createEthRpcCache } from 'eth-rpc-cache'

export const cacheProvider = function <
  T extends JsonRpcProvider | Web3Provider,
>(provider: T) {
  const cached = createEthRpcCache((method, params) =>
    provider.send(method, params),
  )
  const newProvider: T = {
    ...provider,
    send: (method, params) => cached(method, params),
  }
  Object.setPrototypeOf(newProvider, Object.getPrototypeOf(provider))
  return newProvider
}
