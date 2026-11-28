import type { Meta, StoryObj } from '@storybook/react-vite'
import { RenderCryptoBalance } from 'components/cryptoBalance'
import { hemiMainnet } from 'networks/hemiMainnet'
import { getTokenBySymbol } from 'utils/token'
import { parseUnits } from 'viem'

const hemiToken = getTokenBySymbol('HEMI', hemiMainnet.id)

if (!hemiToken) {
  throw new Error('HEMI is missing from the token list')
}

const meta = {
  args: {
    balance: parseUnits('1234.567891234', hemiToken.decimals),
    fetchStatus: 'idle',
    showSymbol: true,
    skeletonWidth: 'default',
    status: 'success',
    token: hemiToken,
  },
  argTypes: {
    balance: { control: false },
    fetchStatus: {
      control: 'inline-radio',
      options: ['fetching', 'idle', 'paused'],
    },
    skeletonWidth: {
      control: 'inline-radio',
      options: ['default', 'wide'],
    },
    status: {
      control: 'inline-radio',
      options: ['error', 'pending', 'success'],
    },
    token: { control: false },
  },
  component: RenderCryptoBalance,
  decorators: [
    Story => (
      <div className="flex h-5 w-64 items-center">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  title: 'Components/Crypto Balance',
} satisfies Meta<typeof RenderCryptoBalance>

export default meta

type Story = StoryObj<typeof RenderCryptoBalance>

export const Default: Story = {}

export const WithoutSymbol: Story = {
  args: { showSymbol: false },
}

export const Zero: Story = {
  args: { balance: BigInt(0) },
}

export const Loading: Story = {
  args: {
    balance: undefined,
    fetchStatus: 'fetching',
    status: 'pending',
  },
}

export const LoadingWide: Story = {
  args: {
    balance: undefined,
    fetchStatus: 'fetching',
    skeletonWidth: 'wide',
    status: 'pending',
  },
}

export const Disabled: Story = {
  args: {
    balance: undefined,
    fetchStatus: 'idle',
    status: 'pending',
  },
}

export const Unavailable: Story = {
  args: {
    balance: undefined,
    status: 'error',
  },
}
