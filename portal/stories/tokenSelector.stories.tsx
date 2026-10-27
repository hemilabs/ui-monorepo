import type { Meta, StoryObj } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UmamiAnalyticsProvider } from 'app/analyticsEvents'
import { TokenSelector } from 'components/tokenSelector'
import messages from 'messages/en.json'
import { allEvmNetworks } from 'networks'
import { hemiMainnet } from 'networks/hemiMainnet'
import { useArgs } from 'storybook/preview-api'
import { tokenList } from 'tokenList'
import { IntlProvider } from 'use-intl'
import { getTokenBySymbol } from 'utils/token'
import { buildTransports } from 'utils/transport'
import { createConfig, WagmiProvider } from 'wagmi'

const hemiTokens = tokenList.tokens.filter(
  token => token.chainId === hemiMainnet.id,
)

const hemiToken = getTokenBySymbol('HEMI', hemiMainnet.id)

if (!hemiToken) {
  throw new Error('HEMI is missing from the token list')
}

const queryClient = new QueryClient()

const wagmiConfig = createConfig({
  chains: allEvmNetworks,
  transports: buildTransports(allEvmNetworks),
})

const meta = {
  args: {
    chainId: hemiMainnet.id,
    disabled: false,
    selectedToken: hemiToken,
    tokens: hemiTokens,
  },
  argTypes: {
    chainId: { control: false },
    disabled: { control: 'boolean' },
    onSelectToken: { control: false },
    selectedToken: { control: false },
    tokens: { control: false },
  },
  component: TokenSelector,
  decorators: [
    Story => (
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <IntlProvider locale="en" messages={messages}>
            <UmamiAnalyticsProvider>
              <Story />
            </UmamiAnalyticsProvider>
          </IntlProvider>
        </QueryClientProvider>
      </WagmiProvider>
    ),
  ],
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <TokenSelector
        {...args}
        onSelectToken={selectedToken => updateArgs({ selectedToken })}
      />
    )
  },
  title: 'Components/Token Selector',
} satisfies Meta<typeof TokenSelector>

export default meta

type Story = StoryObj<typeof TokenSelector>

export const Default: Story = {}

export const Disabled: Story = {
  args: { disabled: true },
}

export const SingleToken: Story = {
  args: { tokens: [hemiToken] },
}

export const Mobile: Story = {
  globals: {
    viewport: { isRotated: false, value: 'mobile1' },
  },
}
