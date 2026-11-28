import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChainLogo } from 'components/chainLogo'
import { CheckMark } from 'components/icons/checkMark'
import { Menu } from 'components/menu'
import { allNetworks } from 'networks'

const selectedChainId = allNetworks[0].id

const meta = {
  args: {
    items: ['All', 'Pending', 'Completed', 'Failed'].map(status => ({
      content: <span>{status}</span>,
      id: status,
    })),
  },
  argTypes: {
    items: { control: false },
  },
  component: Menu,
  parameters: {
    layout: 'centered',
  },
  title: 'Components/Menu',
} satisfies Meta<typeof Menu>

export default meta

type Story = StoryObj<typeof Menu>

export const Default: Story = {}

export const WithIcons: Story = {
  args: {
    items: allNetworks.map(network => ({
      content: (
        <div className="flex items-center gap-x-2 py-1">
          <ChainLogo chainId={network.id} />
          <span className="whitespace-nowrap">{network.name}</span>
          <div
            className={network.id === selectedChainId ? 'block' : 'invisible'}
          >
            <CheckMark />
          </div>
        </div>
      ),
      id: network.id.toString(),
    })),
  },
}

export const Hover: Story = {
  parameters: {
    pseudo: {
      hover: ['li:first-child'],
    },
  },
}
