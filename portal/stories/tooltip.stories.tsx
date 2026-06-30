import type { Meta, StoryObj } from '@storybook/nextjs'
import { Tooltip } from 'components/tooltip'

const INFO_TEXT =
  'By activating 10x approval we automatically add 10x the amount of this transaction as allowance for future ones, saving you money on gas fees and time.'
const RICH_TITLE = 'Approve 10x the amount of this deposit'

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
    text: INFO_TEXT,
    variant: 'info',
    visible: true,
  },
}

export const Rich: Story = {
  args: {
    children: <Trigger label="Rich" />,
    placement: 'top',
    text: INFO_TEXT,
    title: RICH_TITLE,
    variant: 'rich',
    visible: true,
  },
}
