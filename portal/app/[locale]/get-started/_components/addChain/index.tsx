import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useMutation } from '@tanstack/react-query'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useUmami } from 'hooks/useUmami'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { sepolia } from 'networks/sepolia'
import { useEffect } from 'react'
import { Chain } from 'viem'
import { useAccount, useWalletClient } from 'wagmi'

import { useChainAdded } from '../../_hooks/useChainAdded'

import { Container } from './container'

type Props = { chain: Chain; children: React.ReactNode }

export const AddChain = function ({ chain, children }: Props) {
  const { isConnected } = useAccount()
  const [isChainAdded, setIsChainAdded] = useChainAdded(chain)
  const { openConnectModal } = useConnectModal()
  const isConnectedToChain = useIsConnectedToExpectedNetwork(chain.id)
  const { enabled, track } = useUmami()
  const { data: walletClient } = useWalletClient()

  const { mutate: addChain } = useMutation({
    mutationFn: (c: Chain) => walletClient!.addChain({ chain: c }),
    mutationKey: ['add-chain-mutation', chain.id],
    onSuccess() {
      setIsChainAdded(true)
      if (!enabled) {
        return
      }
      switch (chain.id) {
        case sepolia.id:
          track('add to wallet - sepolia')
          break
        case hemiMainnet.id:
          track('add to wallet - hemi mainnet')
          break
        case hemiTestnet.id:
          track('add to wallet - hemi sepolia')
          break
      }
    },
  })

  useEffect(
    function addChainIfConnected() {
      if (isConnectedToChain) {
        setIsChainAdded(true)
      }
    },
    [isConnectedToChain, setIsChainAdded],
  )

  const onClick = function () {
    if (!isConnected) {
      openConnectModal?.()
      return
    }
    if (!isChainAdded && !isConnectedToChain) {
      addChain(chain)
    }
  }

  return (
    <Container
      className={
        isConnected && (isChainAdded || isConnectedToChain)
          ? ''
          : 'cursor-pointer hover:bg-gray-50'
      }
      onClick={onClick}
    >
      {children}
    </Container>
  )
}
