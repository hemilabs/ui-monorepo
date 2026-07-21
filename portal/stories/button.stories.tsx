import type { Meta, StoryObj } from '@storybook/nextjs'
import { Button } from 'components/button'
import { Chevron } from 'components/icons/chevron'
import { ComponentProps } from 'react'

type StoryProps = ComponentProps<typeof Button> & {
  iconLeft: boolean
  iconRight: boolean
}

// Match the Figma icon colors: white on primary, dark on secondary/tertiary.
// The Chevron path ships a fixed gray fill, so override it like the app does.
// `variant` defaults to primary in the component, so anything but an explicit
// secondary/tertiary keeps the white icon (matches the rendered button).
const iconColor = (variant: StoryProps['variant']) =>
  variant === 'secondary' || variant === 'tertiary'
    ? '[&>path]:fill-neutral-950'
    : '[&>path]:fill-white'

const meta = {
  args: {
    children: 'Connect Wallet',
    iconLeft: false,
    iconRight: false,
    size: 'small',
    variant: 'primary',
  },
  argTypes: {
    children: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
    iconLeft: {
      control: 'boolean',
    },
    iconRight: {
      control: 'boolean',
    },
    size: {
      control: 'select',
      options: ['xxSmall', 'xSmall', 'small', 'xLarge'],
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary'],
    },
  },
  component: Button,
  render: ({ children, iconLeft, iconRight, variant, ...args }) => (
    <Button variant={variant} {...args}>
      {iconLeft && <Chevron.Left className={iconColor(variant)} />}
      {children}
      {iconRight && <Chevron.Right className={iconColor(variant)} />}
    </Button>
  ),
  title: 'Components/Button',
} satisfies Meta<StoryProps>

export default meta

type Story = StoryObj<StoryProps>

export const Primary: Story = {
  args: {
    variant: 'primary',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
}

export const Tertiary: Story = {
  args: {
    variant: 'tertiary',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const TwoIcons: Story = {
  args: {
    iconLeft: true,
    iconRight: true,
  },
}

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
