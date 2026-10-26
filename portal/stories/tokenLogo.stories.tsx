import type { Meta, StoryObj } from '@storybook/react-vite'
import { bitcoinMainnet } from 'btc-wallet/chains'
import { TokenLogo } from 'components/tokenLogo'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { mainnet } from 'networks/mainnet'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { tokenList } from 'tokenList'
import { type Token } from 'types/token'

const findToken = function (chainId: Token['chainId'], symbol: string) {
  const token = tokenList.tokens.find(
    t => t.chainId === chainId && t.symbol === symbol,
  )
  if (!token) {
    throw new Error(
      `${symbol} on chain ${chainId} is missing from the token list`,
    )
  }
  return token
}

const hemiToken = findToken(hemiMainnet.id, 'HEMI')

const hemiTokenWithoutLogo = { ...hemiToken, logoURI: undefined }

const sizes = ['xSmall', 'small', 'medium', 'large'] as const

const meta = {
  args: {
    size: 'large',
    token: hemiToken,
    version: 'default',
  },
  argTypes: {
    size: {
      control: 'select',
      options: sizes,
    },
    token: { control: false },
    version: {
      control: 'inline-radio',
      options: ['default', 'L1'],
    },
  },
  component: TokenLogo,
  decorators: [
    (Story, { parameters }) => (
      <NuqsTestingAdapter searchParams={parameters.searchParams}>
        <Story />
      </NuqsTestingAdapter>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  title: 'Components/Token Logo',
} satisfies Meta<typeof TokenLogo>

export default meta

type Story = StoryObj<typeof TokenLogo>

export const Default: Story = {}

export const L1Version: Story = {
  args: { version: 'L1' },
}

export const EthereumToken: Story = {
  args: { token: findToken(mainnet.id, 'ETH') },
}

export const Bitcoin: Story = {
  args: { token: findToken(bitcoinMainnet.id, 'BTC') },
}

export const TbtcOnHemiSepolia: Story = {
  args: { token: findToken(hemiTestnet.id, 'tBTC') },
  parameters: {
    searchParams: { networkType: 'testnet' },
  },
}

export const WithoutLogo: Story = {
  args: { token: hemiTokenWithoutLogo },
}

export const AllSizes: Story = {
  argTypes: {
    size: { control: false },
  },
  render: args => (
    <div className="flex items-center gap-4">
      {sizes.map(size => (
        <TokenLogo {...args} key={size} size={size} />
      ))}
    </div>
  ),
}
