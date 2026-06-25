import type { Meta, StoryObj } from '@storybook/nextjs'
import { Button } from 'components/button'
import { ComponentProps } from 'react'
import Skeleton from 'react-loading-skeleton'

import buttonMeta from './button.stories'

// Reuse the Button story's controls (size, variant, children, icon, disabled) and
// add a `loading` toggle. The loader has no size of its own: it overlays the button
// and fills it, so changing `size` resizes the button and the skeleton follows.
type StoryProps = ComponentProps<typeof Button> & {
  iconPosition: 'none' | 'left' | 'right'
  loading: boolean
}

const meta = {
  ...buttonMeta,
  args: {
    ...buttonMeta.args,
    loading: true,
  },
  argTypes: {
    ...buttonMeta.argTypes,
    loading: {
      control: 'boolean',
    },
  },
  render: ({ loading, ...args }) => (
    <div className="relative inline-block">
      {buttonMeta.render?.(args)}
      {loading && (
        <span className="absolute inset-0">
          <Skeleton
            className={`block h-full ${
              args.size === 'xSmall' ? 'rounded-md' : 'rounded-lg'
            }`}
            containerClassName="block h-full leading-none"
          />
        </span>
      )}
    </div>
  ),
  title: 'Components/Button Loader',
} satisfies Meta<StoryProps>

export default meta

type Story = StoryObj<StoryProps>

export const Default: Story = {}
