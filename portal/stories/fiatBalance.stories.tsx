import type { Meta, StoryObj } from '@storybook/react-vite'
import { type FetchStatus, type QueryStatus } from '@tanstack/react-query'
import { RenderFiatBalance } from 'components/fiatBalance'
import { type useTokenPrices } from 'hooks/useTokenPrices'
import { hemiMainnet } from 'networks/hemiMainnet'
import { formatFiatAmount } from 'utils/format'
import { getTokenBySymbol } from 'utils/token'
import { parseUnits } from 'viem'

const hemiToken = getTokenBySymbol('HEMI', hemiMainnet.id)

if (!hemiToken) {
  throw new Error('HEMI is missing from the token list')
}

const mockPrices = ({
  data,
  fetchStatus = 'idle',
  status,
}: {
  data?: Record<string, string>
  fetchStatus?: FetchStatus
  status: QueryStatus
}) =>
  (() => ({ data, fetchStatus, status })) as unknown as typeof useTokenPrices

const meta = {
  args: {
    balance: parseUnits('1234.567891234', hemiToken.decimals),
    fetchStatus: 'idle',
    queryStatus: 'success',
    token: hemiToken,
    usePrices: mockPrices({ data: { HEMI: '0.0154' }, status: 'success' }),
  },
  argTypes: {
    balance: { control: false },
    customFormatter: { control: false },
    fetchStatus: {
      control: 'inline-radio',
      options: ['fetching', 'idle', 'paused'],
    },
    queryStatus: {
      control: 'inline-radio',
      options: ['error', 'pending', 'success'],
    },
    token: { control: false },
    usePrices: { control: false },
  },
  component: RenderFiatBalance,
  decorators: [
    Story => (
      <div className="flex h-5 items-center">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  title: 'Components/Fiat Balance',
} satisfies Meta<typeof RenderFiatBalance>

export default meta

type Story = StoryObj<typeof RenderFiatBalance>

export const Default: Story = {}

export const WithCustomFormatter: Story = {
  args: { customFormatter: formatFiatAmount },
}

export const Zero: Story = {
  args: { balance: BigInt(0) },
}

export const MissingPrice: Story = {
  args: {
    usePrices: mockPrices({ data: {}, status: 'success' }),
  },
}

export const InvalidPrice: Story = {
  args: {
    usePrices: mockPrices({
      data: { HEMI: 'not-a-number' },
      status: 'success',
    }),
  },
}

export const LoadingBalance: Story = {
  args: {
    balance: undefined,
    fetchStatus: 'fetching',
    queryStatus: 'pending',
  },
}

export const LoadingPrices: Story = {
  args: {
    usePrices: mockPrices({ fetchStatus: 'fetching', status: 'pending' }),
  },
}

export const BalanceUnavailable: Story = {
  args: {
    balance: undefined,
    queryStatus: 'error',
  },
}

export const PricesUnavailable: Story = {
  args: {
    usePrices: mockPrices({ status: 'error' }),
  },
}
