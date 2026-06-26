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

const chainOptions = [
  bitcoinMainnet.id,
  bitcoinTestnet.id,
  mainnet.id,
  sepolia.id,
  hemiMainnet.id,
  hemiTestnet.id,
  unknownChainId,
]

const labels = {
  [bitcoinMainnet.id]: 'Bitcoin Mainnet',
  [bitcoinTestnet.id]: 'Bitcoin Testnet',
  [mainnet.id]: 'Ethereum Mainnet',
  [sepolia.id]: 'Ethereum Sepolia',
  [hemiMainnet.id]: 'Hemi Mainnet',
  [hemiTestnet.id]: 'Hemi Testnet',
  [unknownChainId]: 'Unknown (fallback)',
}

// Storybook `select` controls emit the option as a string, so the numeric chain ids
// would reach `ChainLogo` as strings (e.g. "1") and its `switch` would always fall
// through to the Hemi default. `mapping` coerces each one back to its real id.
const mapping = Object.fromEntries(chainOptions.map(id => [id, id]))

const meta = {
  args: {
    chainId: hemiMainnet.id,
  },
  argTypes: {
    chainId: {
      control: 'select',
      labels,
      mapping,
      options: chainOptions,
    },
  },
  component: ChainLogo,
  title: 'Components/Chain Logo',
} satisfies Meta<typeof ChainLogo>

export default meta

type Story = StoryObj<typeof ChainLogo>

// A single story for the component's only prop: pick a chain from the control to see
// each logo (an unknown id falls back to the Hemi logo).
export const Default: Story = {}
