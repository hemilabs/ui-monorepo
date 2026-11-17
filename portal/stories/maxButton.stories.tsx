import type { Meta, StoryObj } from '@storybook/react-vite'
import { MaxButton } from 'components/setMaxBalance'
import { fn } from 'storybook/test'

const meta = {
  args: {
    disabled: false,
    onClick: fn(),
  },
  argTypes: {
    disabled: { control: 'boolean' },
    onClick: { control: false },
  },
  component: MaxButton,
  parameters: {
    layout: 'centered',
  },
  title: 'Components/Max Button',
} satisfies Meta<typeof MaxButton>

export default meta

type Story = StoryObj<typeof MaxButton>

export const Default: Story = {}

export const Hover: Story = {
  parameters: {
    pseudo: {
      hover: true,
    },
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  argTypes: { disabled: { control: false } },
}
