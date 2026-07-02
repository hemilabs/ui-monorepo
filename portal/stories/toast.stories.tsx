import type { Meta, StoryObj } from '@storybook/nextjs'
import { Toast } from 'components/toast'

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
      mapping: { none: undefined },
      options: ['none', 'success', 'error'],
    },
  },
  component: Toast,
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
