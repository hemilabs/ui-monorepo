import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from 'components/button'
import { SlidingSwitcher } from 'components/slidingSwitcher'
import type { ComponentProps, ReactNode } from 'react'
import { useArgs } from 'storybook/preview-api'

type StoryProps = ComponentProps<typeof SlidingSwitcher>

// SlidingSwitcher is h-full and its panels are absolutely positioned,
// so it needs a container with a fixed size to be visible.
const Frame = ({ children }: { children: ReactNode }) => (
  <div className="h-80 w-96 overflow-hidden rounded-lg border border-neutral-200">
    {children}
  </div>
)

const Panel = ({
  className,
  description,
  heading,
}: {
  className: string
  description: string
  heading: string
}) => (
  <div className={`flex h-full flex-col gap-y-2 p-6 ${className}`}>
    <h4>{heading}</h4>
    <p className="text-neutral-600">{description}</p>
  </div>
)

const meta = {
  args: {
    first: (
      <Panel
        className="bg-neutral-50"
        description="Enter the details of the operation."
        heading="Preview"
      />
    ),
    hideFirst: false,
    second: (
      <Panel
        className="bg-orange-50"
        description="Review the details before confirming."
        heading="Review"
      />
    ),
  },
  argTypes: {
    first: { control: false },
    hideFirst: { control: 'boolean' },
    second: { control: false },
  },
  component: SlidingSwitcher,
  parameters: {
    layout: 'centered',
  },
  title: 'Components/Sliding Switcher',
} satisfies Meta<StoryProps>

export default meta

type Story = StoryObj<StoryProps>

export const Default: Story = {
  render: function Render(args) {
    const [, updateArgs] = useArgs<StoryProps>()
    return (
      <div className="flex flex-col items-start gap-y-4">
        <Button
          onClick={() => updateArgs({ hideFirst: !args.hideFirst })}
          size="small"
        >
          Switch
        </Button>
        <Frame>
          <SlidingSwitcher {...args} />
        </Frame>
      </div>
    )
  },
}

export const ShowingSecond: Story = {
  args: {
    hideFirst: true,
  },
  render: Default.render,
}
