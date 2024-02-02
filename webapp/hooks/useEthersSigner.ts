// Needs to be updated when migrating to wagmi 2.x
// See https://wagmi.sh/react/guides/ethers#connector-client-%E2%86%92-signer
import { providers } from 'ethers'
import { useMemo } from 'react'
import { HttpTransport, type Chain } from 'viem'
import {
  type WalletClient,
  useWalletClient,
  PublicClient,
  usePublicClient,
} from 'wagmi'

// See https://1.x.wagmi.sh/react/ethers-adapters#public-client--provider
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

// See https://1.x.wagmi.sh/react/ethers-adapters#wallet-client--signer
function walletClientToSigner(walletClient: WalletClient) {
  const { account, chain, transport } = walletClient
  const network = {
    chainId: chain.id,
    ensAddress: chain.contracts?.ensRegistry?.address,
    name: chain.name,
  }
  // @ts-expect-error it's the literal code from docs
  const provider = new providers.Web3Provider(transport, network)
  const signer = provider.getSigner(account.address)
  return signer
}

export function useWeb3Provider(chainId: Chain['id']) {
  const { data: walletClient } = useWalletClient({ chainId })
  return useMemo(
    () => (walletClient ? walletClientToSigner(walletClient) : undefined),
    [walletClient],
  )
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
