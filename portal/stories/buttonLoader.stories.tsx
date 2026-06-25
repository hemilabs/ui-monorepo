import type { Meta, StoryObj } from '@storybook/nextjs'
import { ButtonLoader } from 'components/buttonLoader'

// `ButtonLoader` is the `loading` fallback shown while a submit button loads (e.g.
// the dynamically imported ConnectEvmWallet). It has no props and bakes in its own
// height, so it's framed in a box with a `small` button's shape (`h-8`, `rounded-lg`)
// — `overflow-hidden` trims the loader to that size and the wrapper width sets it.
const meta = {
  component: ButtonLoader,
  decorators: [
    Story => (
      <div className="h-8 w-28 overflow-hidden rounded-lg">
        <Story />
      </div>
    ),
  ],
  title: 'Components/Button Loader',
} satisfies Meta<typeof ButtonLoader>

export default meta

type Story = StoryObj<typeof ButtonLoader>

export const Default: Story = {}
