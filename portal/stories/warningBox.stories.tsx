import type { Meta, StoryObj } from '@storybook/nextjs'
import { ExternalLink } from 'components/externalLink'
import { Chevron } from 'components/icons/chevron'
import { WarningBox } from 'components/warningBox'
import { ComponentProps } from 'react'

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

export const Default: Story = {
  render: ({ withClose, ...args }) => (
    <WarningBox {...args} onClose={withClose ? () => undefined : undefined} />
  ),
}

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
