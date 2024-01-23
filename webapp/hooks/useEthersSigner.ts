// Required for @eth-optimism/sdk
// See https://1.x.wagmi.sh/react/ethers-adapters#wallet-client--signer
// Needs to be updated when migrating to wagmi 2.x
// See https://wagmi.sh/react/guides/ethers#connector-client-%E2%86%92-signer
import { providers } from 'ethers'
import { useMemo } from 'react'
import { type Chain } from 'viem'
import { type WalletClient, useWalletClient } from 'wagmi'

export function walletClientToSigner(walletClient: WalletClient) {
  const { account, chain, transport } = walletClient
  const network = {
    chainId: chain.id,
    ensAddress: chain.contracts?.ensRegistry?.address,
    name: chain.name,
  }
  // @ts-expect-error this code is literal from the docs
  const provider = new providers.Web3Provider(transport, network)
  const signer = provider.getSigner(account.address)
  return signer
}

export function useEthersSigner(chainId: Chain['id']) {
  const { data: walletClient } = useWalletClient({ chainId })
  return useMemo(
    () => (walletClient ? walletClientToSigner(walletClient) : undefined),
    [walletClient],
  )
}
