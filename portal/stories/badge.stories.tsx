import type { Meta, StoryObj } from '@storybook/nextjs'
import { Badge } from 'components/badge'

const meta = {
  args: {
    children: 'Badge Label',
    variant: 'primary',
  },
  argTypes: {
    children: { control: 'text' },
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'positive', 'negative', 'negativeB'],
    },
  },
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  title: 'Components/Badge',
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof Badge>

export const Default: Story = {}

export const Variants: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex flex-col items-center gap-y-6">
      <Badge>Badge Label</Badge>
      <Badge variant="secondary">Badge Label</Badge>
      <Badge variant="positive">Badge Label</Badge>
      <Badge variant="negative">Badge Label</Badge>
      <Badge variant="negativeB">Badge Label</Badge>
    </div>
  ),
}
