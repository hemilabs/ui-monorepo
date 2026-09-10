import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox } from 'components/checkbox'
import type { ComponentProps } from 'react'
import { useArgs } from 'storybook/preview-api'

type StoryProps = ComponentProps<typeof Checkbox>

const meta = {
  args: {
    checked: false,
    id: 'checkbox-story',
  },
  argTypes: {
    checked: { control: 'boolean' },
    id: { control: false },
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
  render: function Render({ checked, id }) {
    const [, updateArgs] = useArgs<StoryProps>()
    return (
      <Checkbox
        checked={checked}
        id={id}
        onChange={value => updateArgs({ checked: value })}
      />
    )
  },
}

// The tick is absolutely positioned inside the component, so it stays aligned no
// matter what the surrounding label looks like.
export const WithLabel: Story = {
  render: function Render({ checked, id }) {
    const [, updateArgs] = useArgs<StoryProps>()
    return (
      <label className="flex cursor-pointer items-center gap-x-2" htmlFor={id}>
        <Checkbox
          checked={checked}
          id={id}
          onChange={value => updateArgs({ checked: value })}
        />
        <span className="body-text-medium text-neutral-950">
          I understand and accept the risk
        </span>
      </label>
    )
  },
}
