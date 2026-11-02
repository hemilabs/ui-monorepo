import type { Meta, StoryObj } from '@storybook/react-vite'
import { SettingsTrigger } from 'app/[locale]/hemi-earn/vault/[shareAddress]/_components/advancedSettings/trigger'
import { RenderCryptoBalance } from 'components/cryptoBalance'
import { MaxButton } from 'components/setMaxBalance'
import { TokenInput } from 'components/tokenInput'
import { TokenInputBalance } from 'components/tokenInput/balance'
import { inputErrors } from 'components/tokenInput/utils'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import messages from 'messages/en.json'
import { useArgs } from 'storybook/preview-api'
import { tokenList } from 'tokenList'
import type { Token } from 'types/token'
import { IntlProvider } from 'use-intl'
import { parseUnits } from 'viem'

const hemiTokenAddress = '0x99e3dE3817F6081B2568208337ef83295b7f591D'
const hemiToken = tokenList.tokens.find(
  token => token.address === hemiTokenAddress,
)

if (!hemiToken) {
  throw new Error(`${hemiTokenAddress} is missing from the token list`)
}

const walletBalance = '1250.5'

const StoryBalance = ({ token }: { token: Token }) => (
  <RenderCryptoBalance
    balance={parseUnits(walletBalance, token.decimals)}
    status="success"
    token={token}
  />
)

const errorKeyOptions = ['none', ...inputErrors]

const meta = {
  args: {
    disabled: false,
    errorKey: 'none',
    label: 'Amount',
    showFiatBalance: false,
    token: hemiToken,
    tokenSelector: <TokenSelectorReadOnly logoVersion="L1" token={hemiToken} />,
    value: '100',
  },
  argTypes: {
    bottomRight: { control: false },
    disabled: { control: 'boolean' },
    errorKey: {
      control: 'select',
      mapping: { none: undefined },
      options: errorKeyOptions,
    },
    errorMessage: { control: 'text' },
    fiatBalance: { control: false },
    fiatBalanceComponent: { control: false },
    headerAction: { control: false },
    label: { control: 'text' },
    onChange: { control: false },
    showFiatBalance: { control: false },
    token: { control: false },
    tokenSelector: { control: false },
    value: { control: 'text' },
  },
  component: TokenInput,
  decorators: [
    Story => (
      <IntlProvider locale="en" messages={messages}>
        <div className="mx-auto w-full lg:max-w-[536px]">
          <Story />
        </div>
      </IntlProvider>
    ),
  ],
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <TokenInput
        {...args}
        bottomRight={
          <TokenInputBalance
            balanceComponent={StoryBalance}
            maxButton={
              <MaxButton
                disabled={args.disabled ?? false}
                onClick={() => updateArgs({ value: walletBalance })}
              />
            }
            token={hemiToken}
          />
        }
        onChange={value => updateArgs({ value })}
      />
    )
  },
  title: 'Components/Token Input',
} satisfies Meta<typeof TokenInput>

export default meta

type Story = StoryObj<typeof TokenInput>

export const Default: Story = {}

export const WithoutBalance: Story = {
  render: args => <TokenInput {...args} onChange={() => undefined} />,
}

export const WithErrorMessage: Story = {
  args: {
    errorKey: 'less-than-min-value',
    errorMessage: 'Minimum stake is 10 HEMI',
    value: '1',
  },
}

export const WithHeaderAction: Story = {
  render: args =>
    meta.render({
      ...args,
      headerAction: (
        <SettingsTrigger
          disabled={args.disabled}
          isOpen={false}
          level="normal"
          onClick={() => undefined}
          slippage={undefined}
        />
      ),
    }),
}
