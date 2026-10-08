import type { Meta, StoryObj } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EstimatorAmountField } from 'app/[locale]/hemi-stake/_components/estimator/estimatorAmountField'
import messages from 'messages/en.json'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { useArgs } from 'storybook/preview-api'
import { tokenList } from 'tokenList'
import { IntlProvider } from 'use-intl'
import { parseUnits } from 'viem'

const hemiTokenAddress = '0x99e3dE3817F6081B2568208337ef83295b7f591D'
const hemiToken = tokenList.tokens.find(
  token => token.address === hemiTokenAddress,
)

if (!hemiToken) {
  throw new Error(`${hemiTokenAddress} is missing from the token list`)
}

const queryClient = new QueryClient()

const meta = {
  args: {
    balance: parseUnits('248500', hemiToken.decimals),
    token: hemiToken,
    value: '10000',
  },
  argTypes: {
    balance: { control: false },
    onChange: { control: false },
    token: { control: false },
    value: { control: 'text' },
  },
  component: EstimatorAmountField,
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <IntlProvider locale="en" messages={messages}>
          <NuqsTestingAdapter>
            <div className="mx-auto w-full lg:max-w-[536px]">
              <Story />
            </div>
          </NuqsTestingAdapter>
        </IntlProvider>
      </QueryClientProvider>
    ),
  ],
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <EstimatorAmountField
        {...args}
        onChange={value => updateArgs({ value })}
      />
    )
  },
  title: 'Components/Estimator Amount Field',
} satisfies Meta<typeof EstimatorAmountField>

export default meta

type Story = StoryObj<typeof EstimatorAmountField>

export const Default: Story = {}

export const WithoutWallet: Story = {
  args: { balance: undefined },
}

export const CustomAmount: Story = {
  args: { value: '1234.5' },
}

export const WalletMatchingAPreset: Story = {
  args: { balance: parseUnits('10000', hemiToken.decimals) },
}
