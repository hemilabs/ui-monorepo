import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChainLogo } from 'components/chainLogo'
import { allNetworks } from 'networks'

// The component takes a `chainId` and switches on it. An unknown id falls back to
// the Hemi logo. There's no `size` prop, so the only control is the chain itself.
const unknownChainId = 999999

const meta = {
  component: ChainLogo,
  parameters: {
    layout: 'centered',
  },
  title: 'Components/Chain Logo',
} satisfies Meta<typeof ChainLogo>

export default meta

type Story = StoryObj<typeof ChainLogo>

// Every supported chain side by side, each labelled with its name.
export const Default: Story = {
  argTypes: {
    chainId: { control: false },
  },
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      {allNetworks.map(network => (
        <div className="flex flex-col items-center gap-y-2" key={network.id}>
          <ChainLogo chainId={network.id} />
          <span className="text-xs">{network.name}</span>
        </div>
      ))}
    </div>
  ),
}

export const UnknownChain: Story = {
  args: { chainId: unknownChainId },
}
