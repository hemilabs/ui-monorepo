import type { Meta, StoryObj } from '@storybook/react-vite'
import { Toast } from 'components/toast'
import messages from 'messages/en.json'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { IntlProvider } from 'use-intl'

const meta = {
  args: {
    autoCloseMs: 0,
    description: 'Your deposit was received.',
    title: 'Deposit successful',
    variant: 'success',
  },
  argTypes: {
    autoCloseMs: { control: 'number' },
    description: { control: 'text' },
    goTo: { control: false },
    title: { control: 'text' },
    tx: { control: false },
    variant: {
      control: 'inline-radio',
      options: ['success', 'error'],
    },
  },
  component: Toast,
  decorators: [
    Story => (
      <IntlProvider locale="en" messages={messages}>
        <Story />
      </IntlProvider>
    ),
  ],
  title: 'Components/Toast',
} satisfies Meta<typeof Toast>

export default meta

type Story = StoryObj<typeof Toast>

export const Default: Story = {}

export const WithTransaction: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <Toast
      autoCloseMs={0}
      description="Here's your transaction:"
      title="Deposit successful"
      tx={{
        href: 'https://explorer.hemi.xyz/tx/0x1234abcd5678ef90',
        label: '0x1234…ef90',
      }}
    />
  ),
}

export const WithGoTo: Story = {
  decorators: [
    Story => (
      <NuqsTestingAdapter>
        <Story />
      </NuqsTestingAdapter>
    ),
  ],
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <Toast
      autoCloseMs={0}
      description="Here's your staking transaction:"
      goTo={{
        href: '/stake/dashboard',
        label: 'Go to staking dashboard',
      }}
      title="Staking successful"
      tx={{
        href: 'https://explorer.hemi.xyz/tx/0x1234abcd5678ef90',
        label: '0x1234…ef90',
      }}
    />
  ),
}
