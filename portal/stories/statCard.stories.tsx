import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from 'components/badge'
import { ArrowGrowingIcon } from 'components/icons/arrowGrowingIcon'
import { StatBadgeSkeleton } from 'components/statBadgeSkeleton'
import { StatCard } from 'components/statCard'

const meta = {
  args: {
    badge: (
      <Badge size="small" variant="secondary">
        $1.2M
      </Badge>
    ),
    icon: <ArrowGrowingIcon />,
    isError: false,
    isLoading: false,
    label: 'Total staked',
    value: '82.4M HEMI',
  },
  argTypes: {
    badge: { control: false },
    icon: { control: false },
    label: { control: 'text' },
    value: { control: 'text' },
  },
  component: StatCard,
  decorators: [
    Story => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  title: 'Components/Stat Card',
} satisfies Meta<typeof StatCard>

export default meta

type Story = StoryObj<typeof StatCard>

export const Default: Story = {}

export const Loading: Story = {
  args: {
    badge: <StatBadgeSkeleton size="xSmall" />,
    isLoading: true,
  },
}

export const WithError: Story = {
  args: {
    isError: true,
  },
}

export const WithoutBadge: Story = {
  args: {
    badge: undefined,
  },
}

export const WithoutIcon: Story = {
  args: {
    icon: undefined,
  },
}
