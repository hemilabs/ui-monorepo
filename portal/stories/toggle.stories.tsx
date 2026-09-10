import type { Meta, StoryObj } from '@storybook/react-vite'
import { Toggle } from 'components/toggle'
import type { ComponentProps } from 'react'
import { useArgs } from 'storybook/preview-api'

type StoryProps = ComponentProps<typeof Toggle>

const meta = {
  args: {
    ariaLabel: 'Approve 10x deposit',
    checked: false,
    disabled: false,
    id: 'toggle-story',
  },
  argTypes: {
    ariaLabel: { control: 'text' },
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    id: { control: false },
    onCheckedChange: { control: false },
  },
  component: Toggle,
  title: 'Components/Toggle',
} satisfies Meta<StoryProps>

export default meta

type Story = StoryObj<StoryProps>

// Writing back through useArgs keeps the `checked` control and the rendered state
// in sync — local state would ignore the control after the first render.
export const Default: Story = {
  render: function Render({ ariaLabel, checked, disabled, id }) {
    const [, updateArgs] = useArgs<StoryProps>()
    return (
      <Toggle
        ariaLabel={ariaLabel}
        checked={checked}
        disabled={disabled}
        id={id}
        onCheckedChange={value => updateArgs({ checked: value })}
      />
    )
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  render: Default.render,
}

// The visible text is always a sibling, which is why the component needs its own
// accessible name rather than relying on a wrapping label.
export const InSettingsRow: Story = {
  render: function Render({ ariaLabel, checked, disabled, id }) {
    const [, updateArgs] = useArgs<StoryProps>()
    return (
      <div className="flex w-72 items-center justify-between gap-x-2">
        <span className="body-text-medium text-neutral-900">{ariaLabel}</span>
        <Toggle
          ariaLabel={ariaLabel}
          checked={checked}
          disabled={disabled}
          id={id}
          onCheckedChange={value => updateArgs({ checked: value })}
        />
      </div>
    )
  },
}
