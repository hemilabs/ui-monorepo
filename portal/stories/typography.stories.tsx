import type { Meta, StoryObj } from '@storybook/nextjs'
import type { ReactNode } from 'react'

// "Not really a component" (issue #1993): the typography lives as global styles in
// styles/globals.css (already imported in preview.ts). Organized like vetro (a `Typography/`
// section) but each story uses the designer's Figma format (Hemi Portal, node 15283-17016): rows
// pairing the design-system name, a live sample and the size/line-height.
// Render-only stories with no component/args, so the args shape is the empty object.
type StoryProps = Record<string, never>

const meta = {
  parameters: {
    controls: { disable: true },
  },
  title: 'Typography',
} satisfies Meta<StoryProps>

export default meta

type Story = StoryObj<StoryProps>

const SAMPLE = 'Put your temper to more use'

const Row = ({
  children,
  name,
  size,
}: {
  children: ReactNode
  name: string
  size: string
}) => (
  <div className="flex items-center gap-x-6 px-5 py-4">
    <span className="w-16 shrink-0 text-sm text-neutral-500">{name}</span>
    <div className="min-w-0 flex-1">{children}</div>
    <span className="shrink-0 text-sm text-neutral-400">{size}</span>
  </div>
)

export const Headers: Story = {
  render: () => (
    <>
      <Row name="H1" size="36/40">
        <h1>{SAMPLE}</h1>
      </Row>
      <Row name="H2" size="24/32">
        <h2>{SAMPLE}</h2>
      </Row>
      <Row name="H3" size="17/24">
        <h3>{SAMPLE}</h3>
      </Row>
      <Row name="H4" size="13/18">
        <h4>{SAMPLE}</h4>
      </Row>
    </>
  ),
}

export const Subtitle: Story = {
  render: () => (
    <Row name="S1" size="13/18">
      <span className="body-text-normal text-neutral-500">{SAMPLE}</span>
    </Row>
  ),
}

export const Body: Story = {
  render: () => (
    <>
      <Row name="B" size="13/18">
        <span className="body-text-normal">{SAMPLE}</span>
      </Row>
      <Row name="B-M" size="13/18">
        <span className="body-text-medium">{SAMPLE}</span>
      </Row>
      <Row name="B-SB" size="13/18">
        <span className="body-text-semibold">{SAMPLE}</span>
      </Row>
    </>
  ),
}

export const Caption: Story = {
  render: () => (
    <Row name="C1" size="11/16">
      <span className="body-text-caption">{SAMPLE}</span>
    </Row>
  ),
}

export const Button: Story = {
  render: () => (
    <>
      <Row name="XL" size="15/22">
        <span className="text-mid font-semibold">Button</span>
      </Row>
      <Row name="S" size="13/18">
        <span className="text-sm font-semibold">Button</span>
      </Row>
      <Row name="XS" size="12/17">
        <span className="text-xs font-semibold">Button</span>
      </Row>
    </>
  ),
}
