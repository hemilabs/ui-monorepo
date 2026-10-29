import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatBadgeSkeleton } from 'components/statBadgeSkeleton'

const sizes = ['large', 'medium', 'small', 'xSmall'] as const

const meta = {
  component: StatBadgeSkeleton,
  parameters: {
    controls: { disable: true },
    layout: 'centered',
  },
  title: 'Components/Stat Badge Skeleton',
} satisfies Meta<typeof StatBadgeSkeleton>

export default meta

type Story = StoryObj<typeof StatBadgeSkeleton>

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-y-4">
      {sizes.map(size => (
        <div className="flex flex-col gap-y-1" key={size}>
          <span className="text-xs text-neutral-500">{size}</span>
          <StatBadgeSkeleton size={size} />
        </div>
      ))}
    </div>
  ),
}
