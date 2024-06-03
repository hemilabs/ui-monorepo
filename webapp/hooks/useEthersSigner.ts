// See https://wagmi.sh/react/guides/ethers#connector-client-%E2%86%92-signer
import { isChainSupported } from 'app/networks'
import { providers } from 'ethers'
import { useMemo } from 'react'
import { cacheProvider } from 'ui-common/utils/cache'
import { withdrawalsStrategy } from 'utils/cacheStrategies'
import type { Chain, HttpTransport, PublicClient } from 'viem'
import { Config, useConnectorClient, usePublicClient } from 'wagmi'

// See https://wagmi.sh/react/guides/ethers#client-%E2%86%92-provider
function publicClientToProvider(publicClient: PublicClient) {
  const { chain, transport } = publicClient
  const network = {
    chainId: chain.id,
    ensAddress: chain.contracts?.ensRegistry?.address,
    name: chain.name,
  }
  if (transport.type === 'fallback')
    return new providers.FallbackProvider(
      (transport.transports as ReturnType<HttpTransport>[]).map(({ value }) =>
        cacheProvider(new providers.JsonRpcProvider(value?.url, network), [
          withdrawalsStrategy,
        ]),
      ),
    )
  return cacheProvider(new providers.JsonRpcProvider(transport.url, network), [
    withdrawalsStrategy,
  ])
}

// https://wagmi.sh/react/guides/ethers#connector-client-%E2%86%92-signer
// Types provided by docs do not work, unless [strict](https://www.typescriptlang.org/tsconfig#strict) is enabled.
// See https://github.com/BVM-priv/ui-monorepo/issues/105
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clientToSigner(client: any) {
  const { account, chain, transport } = client
  const network = {
    chainId: chain.id,
    ensAddress: chain.contracts?.ensRegistry?.address,
    name: chain.name,
  }
  const provider = cacheProvider(
    new providers.Web3Provider(transport, network),
    [withdrawalsStrategy],
  )
  const signer = provider.getSigner(account.address)
  return signer
}

export function useWeb3Provider(chainId: Chain['id']) {
  const { data: client } = useConnectorClient<Config>({ chainId })
  return useMemo(
    () =>
      client && isChainSupported(chainId) ? clientToSigner(client) : undefined,
    [chainId, client],
  )
}

export function useJsonRpcProvider(chainId: Chain['id']) {
  const publicClient = usePublicClient({ chainId })
  return useMemo(
    () =>
      publicClient && isChainSupported(chainId)
        ? publicClientToProvider(publicClient)
        : undefined,
    [chainId, publicClient],
  )
}

export type Provider =
  | ReturnType<typeof useWeb3Provider>
  | ReturnType<typeof useJsonRpcProvider>
  | undefined
