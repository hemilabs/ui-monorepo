import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox } from 'components/checkbox'
import type { ComponentProps } from 'react'
import { useArgs } from 'storybook/preview-api'

type StoryProps = ComponentProps<typeof Checkbox>

const meta = {
  args: {
    checked: false,
    className: 'body-text-medium items-center',
    label: 'I understand and accept the risk',
  },
  argTypes: {
    checked: { control: 'boolean' },
    className: { control: 'text' },
    label: { control: 'text' },
    onChange: { control: false },
    ref: { control: false },
  },
  component: Checkbox,
  title: 'Components/Checkbox',
} satisfies Meta<StoryProps>

export default meta

type Story = StoryObj<StoryProps>

// Writing back through useArgs keeps the `checked` control and the rendered state
// in sync — local state would ignore the control after the first render.
export const Default: Story = {
  render: function Render({ checked, className, label }) {
    const [, updateArgs] = useArgs<StoryProps>()
    return (
      <Checkbox
        checked={checked}
        className={className}
        label={label}
        onChange={value => updateArgs({ checked: value })}
      />
    )
  },
}
