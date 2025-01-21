// See https://wagmi.sh/react/guides/ethers#connector-client-%E2%86%92-signer
import { useMemo } from 'react'
import { createSignerProvider, createProvider } from 'utils/providers'
import type { Chain } from 'viem'
import { Config, useConnectorClient, usePublicClient } from 'wagmi'

import { useChainIsSupported } from './useChainIsSupported'

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
  const isSupported = useChainIsSupported(chainId)
  return useMemo(
    () => (client && isSupported ? clientToSigner(client) : undefined),
    [client, isSupported],
  )
}

export function useJsonRpcProvider(chainId: Chain['id']) {
  const publicClient = usePublicClient({ chainId })
  const isSupported = useChainIsSupported(chainId)
  return useMemo(
    () =>
      publicClient && isSupported
        ? createProvider(publicClient.chain)
        : undefined,
    [isSupported, publicClient],
  )
}
