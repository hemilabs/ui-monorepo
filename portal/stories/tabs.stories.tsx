import type { Meta, StoryObj } from '@storybook/nextjs'
import { Tab, Tabs } from 'components/tabs'
import type { ComponentProps } from 'react'
import { useState } from 'react'

type StoryProps = ComponentProps<typeof Tabs> & {
  size: ComponentProps<typeof Tab>['size']
}

const meta = {
  args: {
    size: 'xSmall',
  },
  argTypes: {
    children: { control: false },
    size: { control: 'inline-radio', options: ['xSmall', 'small'] },
  },
  component: Tabs,
  title: 'Components/Tabs',
} satisfies Meta<StoryProps>

export default meta

type Story = StoryObj<StoryProps>

export const Default: Story = {
  render: function Render({ size }) {
    const [filter, setFilter] = useState<'active' | 'withdrawn'>('active')
    return (
      <Tabs>
        <Tab
          onClick={() => setFilter('active')}
          selected={filter === 'active'}
          size={size}
        >
          Active
        </Tab>
        <Tab
          onClick={() => setFilter('withdrawn')}
          selected={filter === 'withdrawn'}
          size={size}
        >
          Withdrawn
        </Tab>
      </Tabs>
    )
  },
}
