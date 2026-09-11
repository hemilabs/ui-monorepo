import type { Meta, StoryObj } from '@storybook/react-vite'
import { TokenPricePill } from 'components/tokenPricePill'
import messages from 'messages/en.json'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { tokenList } from 'tokenList'
import { IntlProvider } from 'use-intl'

const hemiTokenAddress = '0x99e3dE3817F6081B2568208337ef83295b7f591D'
const hemiToken = tokenList.tokens.find(
  token => token.address === hemiTokenAddress,
)

if (!hemiToken) {
  throw new Error(`${hemiTokenAddress} is missing from the token list`)
}

const meta = {
  args: {
    href: 'https://coinmarketcap.com/currencies/hemi/',
    isLoading: false,
    price: '0.0154',
    token: hemiToken,
  },
  argTypes: {
    href: { control: false },
    onClick: { control: false },
    token: { control: false },
  },
  component: TokenPricePill,
  decorators: [
    Story => (
      <IntlProvider locale="en" messages={messages}>
        <NuqsTestingAdapter>
          <Story />
        </NuqsTestingAdapter>
      </IntlProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  title: 'Components/Token Price Pill',
} satisfies Meta<typeof TokenPricePill>

export default meta

type Story = StoryObj<typeof TokenPricePill>

export const Default: Story = {}

export const Hover: Story = {
  parameters: {
    pseudo: {
      hover: true,
    },
  },
}

export const Focus: Story = {
  parameters: {
    pseudo: {
      focusVisible: true,
    },
  },
}

export const Loading: Story = {
  args: {
    isLoading: true,
    price: undefined,
  },
}

export const WithoutPrice: Story = {
  args: {
    price: undefined,
  },
}
