import type { Meta, StoryObj } from '@storybook/nextjs'
import { Tooltip } from 'components/tooltip'

const infoText =
  'By activating 10x approval we automatically add 10x the amount of this transaction as allowance for future ones, saving you money on gas fees and time.'
const richTitle = 'Approve 10x the amount of this deposit'

const Trigger = ({ label }: { label: string }) => (
  <span className="rounded-md border border-neutral-300 px-3 py-1 text-sm font-medium text-neutral-700">
    {label}
  </span>
)

const meta = {
  argTypes: {
    borderRadius: { control: 'inline-radio', options: ['4px', '6px', '12px'] },
    children: { control: false },
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
    text: { control: 'text' },
    variant: { control: false },
    visible: { control: false },
  },
  component: Tooltip,
  decorators: [
    Story => (
      <div className="flex min-h-screen items-center justify-center">
        <Story />
      </div>
    ),
  ],
  title: 'Components/Tooltip',
} satisfies Meta<typeof Tooltip>

export default meta

type Story = StoryObj<typeof Tooltip>

export const Interactive: Story = {
  args: {
    children: <Trigger label="Hover me" />,
    placement: 'top',
    text: 'Copy',
    variant: 'simple',
  },
}

export const Simple: Story = {
  args: {
    children: <Trigger label="Copy" />,
    placement: 'top',
    text: 'Copy',
    variant: 'simple',
    visible: true,
  },
}

export const Info: Story = {
  args: {
    children: <Trigger label="Info" />,
    placement: 'top',
    text: infoText,
    variant: 'info',
    visible: true,
  },
}

export const Rich: Story = {
  args: {
    children: <Trigger label="Rich" />,
    placement: 'top',
    text: infoText,
    title: richTitle,
    variant: 'rich',
    visible: true,
  },
}
