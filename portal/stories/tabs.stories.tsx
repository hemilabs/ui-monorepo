import type { Meta, StoryObj } from '@storybook/nextjs'
import { Tab, Tabs } from 'components/tabs'
import { useState } from 'react'

const meta = {
  component: Tabs,
  parameters: {
    controls: { disable: true },
  },
  title: 'Components/Tabs',
} satisfies Meta<typeof Tabs>

export default meta

type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  render: function Render() {
    const [filter, setFilter] = useState<'active' | 'withdrawn'>('active')
    return (
      <Tabs>
        <Tab onClick={() => setFilter('active')} selected={filter === 'active'}>
          Active
        </Tab>
        <Tab
          onClick={() => setFilter('withdrawn')}
          selected={filter === 'withdrawn'}
        >
          Withdrawn
        </Tab>
      </Tabs>
    )
  },
}
