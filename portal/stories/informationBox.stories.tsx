import type { Meta, StoryObj } from '@storybook/nextjs'
import { EmptyIcon } from 'app/[locale]/staking-dashboard/_icons/emptyIcon'
import { Button } from 'components/button'
import { InformationBox } from 'components/informationBox'
import { ComponentProps } from 'react'

type StoryProps = ComponentProps<typeof InformationBox> & {
  withActions: boolean
  withSecondaryAction: boolean
}

const meta = {
  args: {
    subtitle: 'Get started by staking your HEMI',
    title: 'No HEMI staked',
    withActions: false,
    withSecondaryAction: false,
  },
  argTypes: {
    subtitle: { control: 'text' },
    title: { control: 'text' },
    withActions: { control: 'boolean' },
    withSecondaryAction: { control: 'boolean', if: { arg: 'withActions' } },
  },
  component: InformationBox,
  decorators: [
    Story => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  title: 'Components/Information Box',
} satisfies Meta<StoryProps>

export default meta

type Story = StoryObj<StoryProps>

export const Default: Story = {
  render: ({ withActions, withSecondaryAction, ...args }) => (
    <InformationBox
      {...args}
      actions={
        withActions ? (
          <>
            <Button size="xxSmall" type="button">
              Stake
            </Button>
            {withSecondaryAction && (
              <Button size="xxSmall" type="button" variant="secondary">
                Learn more
              </Button>
            )}
          </>
        ) : undefined
      }
      icon={<EmptyIcon />}
    />
  ),
}

export const WithActions: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <InformationBox
      actions={
        <>
          <Button size="xxSmall" type="button">
            Stake
          </Button>
          <Button size="xxSmall" type="button" variant="secondary">
            Learn more
          </Button>
        </>
      }
      icon={<EmptyIcon />}
      subtitle="Get started by staking your HEMI"
      title="No HEMI staked"
    />
  ),
}
