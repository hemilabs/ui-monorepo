import { bitcoinMainnet, bitcoinTestnet } from 'btc-wallet/chains'
import { BitcoinIcon } from 'components/reviewOperation/_icons/bitcoinIcon'
import { EthIcon } from 'components/reviewOperation/_icons/ethIcon'
import { HemiIcon } from 'components/reviewOperation/_icons/hemiIcon'
import { hemi, hemiSepolia } from 'hemi-viem'
import type { ReactNode } from 'react'
import type { RemoteChain } from 'types/chain'
import { mainnet, sepolia } from 'viem/chains'

type Props = {
  chainId: RemoteChain['id']
}

const chainIconMap: Partial<Record<RemoteChain['id'], ReactNode>> = {
  [sepolia.id]: <EthIcon />,
  [mainnet.id]: <EthIcon />,
  [hemiSepolia.id]: <HemiIcon />,
  [hemi.id]: <HemiIcon />,
  [bitcoinTestnet.id]: <BitcoinIcon />,
  [bitcoinMainnet.id]: <BitcoinIcon />,
}

export const ChainIcon = ({ chainId }: Props) => chainIconMap[chainId]
