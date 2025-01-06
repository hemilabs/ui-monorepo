import {
  type JsonRpcProvider,
  type Web3Provider,
} from '@ethersproject/providers'
import {
  createEthRpcCache,
  perBlockStrategy,
  permanentStrategy,
} from 'eth-rpc-cache'
import { providers } from 'ethers'
import { withdrawalsStrategy } from 'utils/cacheStrategies'
import { type Account, type Chain, type HttpTransport } from 'viem'

const cacheProvider = function <T extends JsonRpcProvider | Web3Provider>(
  provider: T,
  strategies: (typeof permanentStrategy)[] = [],
) {
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

const toNetwork = (chain: Chain) => ({
  chainId: chain.id,
  ensAddress: chain.contracts?.ensRegistry?.address,
  name: chain.name,
})

export const createPublicProvider = (url: string | undefined, chain: Chain) =>
  cacheProvider(new providers.JsonRpcProvider(url, toNetwork(chain)), [
    withdrawalsStrategy,
  ])

export const createFallbackProvider = (
  chain: Chain,
  transports: ReturnType<HttpTransport>[],
) =>
  new providers.FallbackProvider(
    transports.map(({ value }) => createPublicProvider(value?.url, chain)),
  )

// https://wagmi.sh/react/guides/ethers#connector-client-%E2%86%92-signer
export const createSignerProvider = function (
  account: Account,
  chain: Chain,
  transport: providers.ExternalProvider,
) {
  const provider = cacheProvider(
    new providers.Web3Provider(transport, toNetwork(chain)),
    [withdrawalsStrategy],
  )
  const signer = provider.getSigner(account.address)
  return signer
}
