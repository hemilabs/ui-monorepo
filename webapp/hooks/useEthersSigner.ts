// See https://wagmi.sh/react/guides/ethers#connector-client-%E2%86%92-signer
import { isChainSupported } from 'app/networks'
import { useMemo } from 'react'
import {
  createFallbackProvider,
  createPublicProvider,
  createSignerProvider,
} from 'utils/providers'
import type { Chain, PublicClient } from 'viem'
import { Config, useConnectorClient, usePublicClient } from 'wagmi'

// See https://wagmi.sh/react/guides/ethers#client-%E2%86%92-provider
function publicClientToProvider(publicClient: PublicClient) {
  const { chain, transport } = publicClient
  if (transport.type === 'fallback') {
    return createFallbackProvider(chain, transport.transports)
  }
  return createPublicProvider(transport.url, chain)
}

// https://wagmi.sh/react/guides/ethers#connector-client-%E2%86%92-signer
// Types provided by docs do not work, unless [strict](https://www.typescriptlang.org/tsconfig#strict) is enabled.
// See https://github.com/hemilabs/ui-monorepo/issues/105
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clientToSigner(client: any) {
  const { account, chain, transport } = client
  return createSignerProvider(account, chain, transport)
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
