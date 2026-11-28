import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card } from 'components/card'

const shadows = ['none', 'bs', 'sm', 'md', 'lg', 'xl'] as const

const meta = {
  args: {
    children: <div className="p-6 text-sm text-neutral-950">Card content</div>,
    shadow: 'md',
  },
  argTypes: {
    children: { control: false },
    shadow: { control: 'inline-radio', options: shadows },
  },
  component: Card,
  parameters: {
    layout: 'centered',
  },
  title: 'Components/Card',
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof Card>

export const Default: Story = {}

export const Shadows: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="grid grid-cols-3 gap-8">
      {shadows.map(shadow => (
        <Card key={shadow} shadow={shadow}>
          <div className="p-6 text-sm text-neutral-950">{shadow}</div>
        </Card>
      ))}
    </div>
  ),
}
