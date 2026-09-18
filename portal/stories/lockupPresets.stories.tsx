import type { Meta, StoryObj } from '@storybook/react-vite'
import { LockupPresets } from 'app/[locale]/hemi-stake/_components/lockup/lockupPresets'
import { useArgs } from 'storybook/preview-api'

const options = [
  { days: 180, label: '6 months' },
  { days: 366, label: '1 year' },
  { days: 732, label: '2 years' },
  { days: 1461, label: '4 years' },
]

const meta = {
  args: { labelledBy: 'lockup-period-label', options, value: 732 },
  argTypes: {
    labelledBy: { control: false },
    onSelect: { control: false },
    options: { control: false },
  },
  component: LockupPresets,
  decorators: [
    Story => (
      <div className="w-120 rounded-lg bg-neutral-50 p-4">
        <span className="sr-only" id="lockup-period-label">
          Lockup period
        </span>
        <Story />
      </div>
    ),
  ],
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <LockupPresets {...args} onSelect={days => updateArgs({ value: days })} />
    )
  },
  title: 'Components/Lockup Presets',
} satisfies Meta<typeof LockupPresets>

export default meta

type Story = StoryObj<typeof LockupPresets>

export const Default: Story = {}

export const Hover: Story = {
  parameters: { pseudo: { hover: true } },
}

export const WithApr: Story = {
  args: {
    options: [
      { days: 180, label: '6 months', sublabel: '~10%' },
      { days: 366, label: '1 year', sublabel: '~20%' },
      { days: 732, label: '2 years', sublabel: '~40%' },
      { days: 1461, label: '4 years', sublabel: 'up to 80%' },
    ],
  },
}
