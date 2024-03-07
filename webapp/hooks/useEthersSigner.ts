// Needs to be updated when migrating to wagmi 2.x
// See https://wagmi.sh/react/guides/ethers#connector-client-%E2%86%92-signer
import { providers } from 'ethers'
import { useMemo } from 'react'
import type { Chain, HttpTransport, PublicClient } from 'viem'
import { Config, useConnectorClient, usePublicClient } from 'wagmi'

// See https://wagmi.sh/react/guides/ethers#client-%E2%86%92-provider
export function publicClientToProvider(publicClient: PublicClient) {
  const { chain, transport } = publicClient
  const network = {
    chainId: chain.id,
    ensAddress: chain.contracts?.ensRegistry?.address,
    name: chain.name,
  }
  if (transport.type === 'fallback')
    return new providers.FallbackProvider(
      (transport.transports as ReturnType<HttpTransport>[]).map(
        ({ value }) => new providers.JsonRpcProvider(value?.url, network),
      ),
    )
  return new providers.JsonRpcProvider(transport.url, network)
}

// https://wagmi.sh/react/guides/ethers#connector-client-%E2%86%92-signer
// Types provided by docs do not work, unless [strict](https://www.typescriptlang.org/tsconfig#strict) is enabled.
// See https://github.com/BVM-priv/ui-monorepo/issues/105
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function clientToSigner(client: any) {
  const { account, chain, transport } = client
  const network = {
    chainId: chain.id,
    ensAddress: chain.contracts?.ensRegistry?.address,
    name: chain.name,
  }
  const provider = new providers.Web3Provider(transport, network)
  const signer = provider.getSigner(account.address)
  return signer
}

export function useWeb3Provider(chainId: Chain['id']) {
  const { data: client } = useConnectorClient<Config>({ chainId })
  return useMemo(() => (client ? clientToSigner(client) : undefined), [client])
}

export function useJsonRpcProvider(chainId: Chain['id']) {
  const publicClient = usePublicClient({ chainId })
  return useMemo(
    () => (publicClient ? publicClientToProvider(publicClient) : undefined),
    [publicClient],
  )
}

export type Provider =
  | ReturnType<typeof useWeb3Provider>
  | ReturnType<typeof useJsonRpcProvider>
  | undefined
