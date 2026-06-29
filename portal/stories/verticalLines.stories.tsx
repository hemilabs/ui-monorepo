import type { Meta, StoryObj } from '@storybook/nextjs'
import { LongVerticalLine, ShortVerticalLine } from 'components/verticalLines'
import { ComponentProps } from 'react'

// Connector lines drawn between steps in the review / get-started flows, which sit on white card
// surfaces — so the stories render on the default light canvas. There are two exported lengths
// (Short 24px, Long 68px); a synthetic `length` control switches between them. `stroke` and
// `dashed` map straight to the real props.
type LineProps = ComponentProps<typeof LongVerticalLine>

const strokeOptions: LineProps['stroke'][] = [
  'stroke-neutral-300',
  'stroke-neutral-300/55',
  'stroke-orange-600',
  'stroke-rose-500',
]

type StoryProps = LineProps & { length: 'short' | 'long' }

const meta = {
  args: {
    dashed: true,
    length: 'long',
    stroke: 'stroke-neutral-300',
  },
  argTypes: {
    dashed: {
      control: 'boolean',
    },
    length: {
      control: 'inline-radio',
      options: ['short', 'long'],
    },
    stroke: {
      control: 'select',
      // Friendly labels — the value is the real Tailwind class the prop expects.
      labels: Object.fromEntries(
        strokeOptions.map(stroke => [stroke, stroke.replace('stroke-', '')]),
      ),
      options: strokeOptions,
    },
  },
  component: LongVerticalLine,
  title: 'Components/Vertical Lines',
} satisfies Meta<StoryProps>

export default meta

type Story = StoryObj<StoryProps>

// Playground: pick length (Short/Long), stroke and dashed from the controls.
export const Default: Story = {
  render: ({ length, ...props }) =>
    length === 'short' ? (
      <ShortVerticalLine {...props} />
    ) : (
      <LongVerticalLine {...props} />
    ),
}

// Render-only showcase: every stroke, solid (left) and dashed (right), on the Long line.
export const Strokes: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="flex gap-x-4">
      {strokeOptions.map(stroke => (
        <div className="flex w-28 flex-col items-center gap-y-2" key={stroke}>
          <div className="flex gap-x-3">
            <LongVerticalLine dashed={false} stroke={stroke} />
            <LongVerticalLine stroke={stroke} />
          </div>
          <span className="text-xs text-neutral-500">
            {stroke.replace('stroke-', '')}
          </span>
        </div>
      ))}
    </div>
  ),
}
