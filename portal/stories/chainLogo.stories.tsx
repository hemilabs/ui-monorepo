import type { Meta, StoryObj } from '@storybook/nextjs'
import { bitcoinMainnet, bitcoinTestnet } from 'btc-wallet/chains'
import { ChainLogo } from 'components/chainLogo'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { mainnet } from 'networks/mainnet'
import { sepolia } from 'networks/sepolia'

// The component takes a `chainId` and switches on it. An unknown id falls back to
// the Hemi logo. There's no `size` prop, so the only control is the chain itself.
const unknownChainId = 999999

const labels = {
  [bitcoinMainnet.id]: 'Bitcoin Mainnet',
  [bitcoinTestnet.id]: 'Bitcoin Testnet',
  [mainnet.id]: 'Ethereum Mainnet',
  [sepolia.id]: 'Ethereum Sepolia',
  [hemiMainnet.id]: 'Hemi Mainnet',
  [hemiTestnet.id]: 'Hemi Testnet',
  [unknownChainId]: 'Unknown (fallback)',
}

const meta = {
  args: {
    chainId: hemiMainnet.id,
  },
  argTypes: {
    chainId: {
      control: 'select',
      labels,
      options: [
        bitcoinMainnet.id,
        bitcoinTestnet.id,
        mainnet.id,
        sepolia.id,
        hemiMainnet.id,
        hemiTestnet.id,
        unknownChainId,
      ],
    },
  },
  component: ChainLogo,
  title: 'Components/Chain Logo',
} satisfies Meta<typeof ChainLogo>

export default meta

type Story = StoryObj<typeof ChainLogo>

export const Hemi: Story = {
  args: { chainId: hemiMainnet.id },
}

export const Ethereum: Story = {
  args: { chainId: mainnet.id },
}

export const Bitcoin: Story = {
  args: { chainId: bitcoinMainnet.id },
}

// Any unrecognized id renders the Hemi logo (the component's default branch).
export const Unknown: Story = {
  args: { chainId: unknownChainId },
}
