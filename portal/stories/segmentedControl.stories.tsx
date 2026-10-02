import type { Meta, StoryObj } from '@storybook/react-vite'
import { SegmentedControl } from 'components/segmentedControl'
import { useArgs } from 'storybook/preview-api'

const meta = {
  args: {
    label: 'Period',
    options: [
      { label: '1 Week', value: '1w' },
      { label: '1 Month', value: '1m' },
      { label: '3 Months', value: '3m' },
      { label: '1 Year', value: '1y' },
    ],
    value: '1w',
  },
  argTypes: {
    onChange: { control: false },
    options: { control: false },
  },
  component: SegmentedControl,
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <SegmentedControl {...args} onChange={value => updateArgs({ value })} />
    )
  },
  title: 'Components/Segmented Control',
} satisfies Meta<typeof SegmentedControl>

export default meta

type Story = StoryObj<typeof SegmentedControl>

export const Default: Story = {}

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    value: '1m',
  },
  decorators: [
    Story => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
}
