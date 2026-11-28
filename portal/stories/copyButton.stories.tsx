import type { Meta, StoryObj } from '@storybook/react-vite'
import { CopyButton } from 'components/copyButton'

const meta = {
  args: {
    text: '0x1234abcd5678ef901234abcd5678ef901234abcd5678ef901234abcd5678ef90',
  },
  argTypes: {
    text: { control: 'text' },
  },
  component: CopyButton,
  title: 'Components/CopyButton',
} satisfies Meta<typeof CopyButton>

export default meta

type Story = StoryObj<typeof CopyButton>

export const Default: Story = {}

export const NextToAHash: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex items-center gap-x-2 text-sm text-neutral-950">
      0x1234…ef90
      <CopyButton text="0x1234abcd5678ef901234abcd5678ef901234abcd5678ef901234abcd5678ef90" />
    </div>
  ),
}
