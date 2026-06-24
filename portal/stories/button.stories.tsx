import type { Meta, StoryObj } from '@storybook/nextjs'
import { Button } from 'components/button'

const meta = {
  argTypes: {
    children: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
    size: {
      control: 'select',
      options: ['xSmall', 'small', 'xLarge'],
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary'],
    },
  },
  component: Button,
  title: 'Components/Button',
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: 'Connect Wallet',
    size: 'small',
    variant: 'primary',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Connect Wallet',
    size: 'small',
    variant: 'secondary',
  },
}

export const Tertiary: Story = {
  args: {
    children: 'Connect Wallet',
    size: 'small',
    variant: 'tertiary',
  },
}

export const Disabled: Story = {
  args: {
    children: 'Connect Wallet',
    disabled: true,
    size: 'small',
    variant: 'primary',
  },
}
