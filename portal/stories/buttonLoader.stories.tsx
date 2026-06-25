import type { Meta, StoryObj } from '@storybook/nextjs'
import { ButtonLoader } from 'components/buttonLoader'

// `ButtonLoader` is the `loading` fallback for a dynamically imported submit button
// (e.g. ConnectEvmWallet). It has no props and a fixed height (`containerClassName=
// "h-11.5"`, ~46px, the xLarge size it stands in for). This story deliberately frames
// it in a `small` button box (`h-8`, `rounded-lg`): `overflow-hidden` trims the
// loader's fixed height to that shape and the wrapper width sizes it.
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
