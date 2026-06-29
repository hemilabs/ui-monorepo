import type { Meta, StoryObj } from '@storybook/nextjs'
import { Spinner } from 'components/spinner'

// Backgrounds mirror where each variant is actually used in the app:
// - `light` (#FFF7F0, near-white) is the loading state inside primary buttons, whose surface is
//   `bg-orange-600` (see components/button/button.css) — so it's shown on orange here.
// - `orange` sits on white/neutral surfaces (review screens, pages) — so it's shown on white.
// The numeric `size` is omitted from the control (the named sizes cover the documented cases).

const meta = {
  args: {
    size: 'medium',
    variant: 'light',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xSmall', 'small', 'medium', 'large'],
    },
    variant: {
      control: 'inline-radio',
      options: ['light', 'orange'],
    },
  },
  component: Spinner,
  title: 'Components/Spinner',
} satisfies Meta<typeof Spinner>

export default meta

type Story = StoryObj<typeof Spinner>

// Playground: the backdrop follows the selected variant's real surface in the app.
export const Default: Story = {
  render: ({ variant, ...args }) => (
    <div
      className={`flex items-center justify-center rounded-lg p-6 ${
        variant === 'orange' ? 'bg-white' : 'bg-orange-600'
      }`}
    >
      <Spinner variant={variant} {...args} />
    </div>
  ),
}

// Render-only showcase of every named size (orange on white, controls disabled).
export const Sizes: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex items-center gap-x-4">
      <Spinner size="xSmall" variant="orange" />
      <Spinner size="small" variant="orange" />
      <Spinner size="medium" variant="orange" />
      <Spinner size="large" variant="orange" />
    </div>
  ),
}
