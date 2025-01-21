// See https://wagmi.sh/react/guides/ethers#connector-client-%E2%86%92-signer
import memoize from 'lodash/memoize'
import { useMemo } from 'react'
import { findChainById, isEvmNetwork } from 'utils/chain'
import { createSignerProvider, createProvider } from 'utils/providers'
import type { Chain } from 'viem'
import { Config, useConnectorClient } from 'wagmi'

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

// No need to pass a resolver function, as it defaults to the first argument value,
// and "supported" is derived from the chainId
const memoized = memoize(function (id: Chain['id'], supported: boolean) {
  const chain = findChainById(id)
  if (!chain || !supported || !isEvmNetwork(chain)) {
    return undefined
  }
  return createProvider(chain)
})

export function useJsonRpcProvider(chainId: Chain['id']) {
  const isSupported = useChainIsSupported(chainId)
  return memoized(chainId, isSupported)
}
