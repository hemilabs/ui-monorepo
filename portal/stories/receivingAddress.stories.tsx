import type { Meta, StoryObj } from '@storybook/react-vite'
import { ReceivingAddress } from 'app/[locale]/tunnel/_components/receivingAddress'
import messages from 'messages/en.json'
import { useArgs } from 'storybook/preview-api'
import { IntlProvider } from 'use-intl'

type StoryProps = {
  address: string | undefined
  customAddress: string
  customAddressEnabled: boolean
  disabled: boolean
  editable: boolean
  isCheckingAddress: boolean
  isCustomAddressValid: boolean | undefined
  placeholder: string
  receivingText: string
  tooltipText: string
}

const meta = {
  args: {
    address: 'bc1qxy...0wlh',
    customAddress: '',
    customAddressEnabled: false,
    disabled: false,
    editable: true,
    isCheckingAddress: false,
    isCustomAddressValid: undefined,
    placeholder: 'Bitcoin address...',
    receivingText: 'Receiving Bitcoin address',
    tooltipText:
      'Withdrawn BTC is sent to the address of your connected Bitcoin wallet, or to the custom address you enter.',
  },
  argTypes: {
    address: { control: 'text' },
    customAddress: { control: 'text', if: { arg: 'editable' } },
    customAddressEnabled: { control: 'boolean', if: { arg: 'editable' } },
    disabled: { control: 'boolean', if: { arg: 'editable' } },
    editable: { control: 'boolean' },
    isCheckingAddress: { control: 'boolean', if: { arg: 'editable' } },
    isCustomAddressValid: {
      control: 'select',
      if: { arg: 'editable' },
      mapping: { unknown: undefined },
      options: ['unknown', true, false],
    },
    placeholder: { control: 'text', if: { arg: 'editable' } },
    receivingText: { control: 'text' },
    tooltipText: { control: 'text' },
  },
  decorators: [
    Story => (
      <IntlProvider locale="en" messages={messages}>
        <div className="w-[536px]">
          <Story />
        </div>
      </IntlProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  render: function Render({ editable, ...args }) {
    const [, updateArgs] = useArgs<StoryProps>()
    if (!editable) {
      return (
        <ReceivingAddress
          address={args.address}
          editable={false}
          receivingText={args.receivingText}
          tooltipText={args.tooltipText}
        />
      )
    }
    return (
      <ReceivingAddress
        {...args}
        editable
        onCustomAddressChange={customAddress => updateArgs({ customAddress })}
        onCustomAddressEnabledChange={customAddressEnabled =>
          updateArgs({ customAddressEnabled })
        }
      />
    )
  },
  title: 'Components/Receiving Address',
} satisfies Meta<StoryProps>

export default meta

type Story = StoryObj<StoryProps>

export const Default: Story = {}

export const ReadOnly: Story = {
  args: {
    address: '0x1234...abcd',
    editable: false,
    receivingText: 'Receiving Hemi address',
    tooltipText:
      'Deposited BTC is sent to the address associated with your connected EVM wallet.',
  },
}

export const NoAddress: Story = {
  args: { address: undefined },
}

export const CustomAddressEmpty: Story = {
  args: { customAddressEnabled: true },
}

export const CustomAddressChecking: Story = {
  args: {
    customAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    customAddressEnabled: true,
    isCheckingAddress: true,
  },
}

export const CustomAddressValid: Story = {
  args: {
    customAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    customAddressEnabled: true,
    isCustomAddressValid: true,
  },
}

export const CustomAddressInvalid: Story = {
  args: {
    customAddress: 'not-a-bitcoin-address',
    customAddressEnabled: true,
    isCustomAddressValid: false,
  },
}

export const Disabled: Story = {
  args: {
    customAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    customAddressEnabled: true,
    disabled: true,
    isCustomAddressValid: true,
  },
}
