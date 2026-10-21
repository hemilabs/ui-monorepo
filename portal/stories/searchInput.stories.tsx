import type { Meta, StoryObj } from '@storybook/react-vite'
import { SearchInput } from 'components/inputText'
import type { ComponentProps } from 'react'
import { useArgs } from 'storybook/preview-api'

type StoryProps = ComponentProps<typeof SearchInput>

const sizes = ['xs', 's', 'xl'] as const

const meta = {
  args: {
    disabled: false,
    placeholder: 'Search tokens',
    showMagnifyingGlass: true,
    size: 's',
    value: '',
  },
  argTypes: {
    disabled: { control: 'boolean' },
    onChange: { control: false },
    onClear: { control: false },
    placeholder: { control: 'text' },
    showMagnifyingGlass: { control: 'boolean' },
    size: { control: 'inline-radio', options: sizes },
    value: { control: 'text' },
  },
  component: SearchInput,
  decorators: [
    Story => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  title: 'Components/Search Input',
} satisfies Meta<StoryProps>

export default meta

type Story = StoryObj<StoryProps>

export const Default: Story = {
  render: function Render(args) {
    const [, updateArgs] = useArgs<StoryProps>()
    return (
      <SearchInput
        {...args}
        onChange={e => updateArgs({ value: e.target.value })}
        onClear={() => updateArgs({ value: '' })}
      />
    )
  },
}

export const Sizes: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex flex-col gap-y-6">
      {sizes.map(size => (
        <SearchInput key={size} placeholder="Search tokens" size={size} />
      ))}
    </div>
  ),
}

export const WithValue: Story = {
  ...Default,
  args: {
    value: 'HEMI',
  },
}
