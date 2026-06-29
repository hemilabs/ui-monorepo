import type { Meta, StoryObj } from '@storybook/nextjs'
import { ExternalLink } from 'components/externalLink'
import { Chevron } from 'components/icons/chevron'
import { WarningBox } from 'components/warningBox'
import { ComponentProps } from 'react'

// Informational box used inside drawers / review screens (e.g. the unstake-ETH disclaimer). It
// brings its own `bg-neutral-50` surface and sits on white panels, so the stories render on the
// default light canvas, width-constrained to match the narrow drawers where it appears. `heading`
// and `subheading` are text controls; a synthetic `withClose` toggles the optional close button.
type StoryProps = ComponentProps<typeof WarningBox> & { withClose: boolean }

const meta = {
  args: {
    heading: 'Unstake ETH as WETH',
    subheading:
      'Unstaking returns WETH, not native ETH. You can unwrap it afterwards.',
    withClose: false,
  },
  argTypes: {
    heading: { control: 'text' },
    subheading: { control: 'text' },
    withClose: { control: 'boolean' },
  },
  component: WarningBox,
  decorators: [
    Story => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  title: 'Components/Warning Box',
} satisfies Meta<StoryProps>

export default meta

type Story = StoryObj<StoryProps>

// Playground: edit the texts and toggle the close button from the controls.
export const Default: Story = {
  render: ({ withClose, ...args }) => (
    <WarningBox {...args} onClose={withClose ? () => undefined : undefined} />
  ),
}

// Render-only showcase: a warning box with rich `children` (a link), mirroring the app usage.
export const WithChildren: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <WarningBox
      heading="Unstake ETH as WETH"
      subheading="Unstaking returns WETH, not native ETH."
    >
      <ExternalLink
        className="group/disclaimer flex cursor-pointer items-center gap-x-1 text-sm"
        href="https://pure.finance/en/wrap-eth/"
      >
        <span className="text-orange-600 group-hover/disclaimer:text-orange-700">
          Unwrap
        </span>
        <Chevron.Right className="[&>path]:fill-orange-600 group-hover/disclaimer:[&>path]:fill-orange-700" />
      </ExternalLink>
    </WarningBox>
  ),
}
