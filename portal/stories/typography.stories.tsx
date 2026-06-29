import type { Meta, StoryObj } from '@storybook/nextjs'
import { ReactNode } from 'react'

// "Not really a component" (issue #1993): the typography lives as global styles in
// styles/globals.css (already imported in preview.ts). Organized like vetro (a `Typography/`
// section) but each story uses the designer's Figma format (Hemi Portal, node 15283-17016): a card
// whose rows pair the design-system name, a live sample and the size/line-height. Subtitle and
// Caption are de-emphasized exactly as in the Figma.
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
  <div className="flex items-center gap-x-6 border-b border-neutral-200 px-5 py-4 last:border-b-0">
    <span className="w-16 shrink-0 text-sm text-neutral-500">{name}</span>
    <div className="min-w-0 flex-1">{children}</div>
    <span className="shrink-0 text-sm text-neutral-400">{size}</span>
  </div>
)

// `muted` mirrors the Figma, where Subtitle and Caption are shown de-emphasized.
const Card = ({
  children,
  muted = false,
}: {
  children: ReactNode
  muted?: boolean
}) => (
  <div
    className={`max-w-3xl rounded-xl border border-neutral-200 ${
      muted ? 'opacity-50' : ''
    }`}
  >
    {children}
  </div>
)

export const Headers: Story = {
  render: () => (
    <Card>
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
    </Card>
  ),
}

export const Subtitle: Story = {
  render: () => (
    <Card muted>
      <Row name="S1" size="13/18">
        <span className="body-text-normal text-neutral-500">{SAMPLE}</span>
      </Row>
    </Card>
  ),
}

export const Body: Story = {
  render: () => (
    <Card>
      <Row name="B" size="13/18">
        <span className="body-text-normal">{SAMPLE}</span>
      </Row>
      <Row name="B-M" size="13/18">
        <span className="body-text-medium">{SAMPLE}</span>
      </Row>
      <Row name="B-SB" size="13/18">
        <span className="body-text-semibold">{SAMPLE}</span>
      </Row>
    </Card>
  ),
}

export const Caption: Story = {
  render: () => (
    <Card muted>
      <Row name="C1" size="11/16">
        <span className="body-text-caption">{SAMPLE}</span>
      </Row>
    </Card>
  ),
}

export const Button: Story = {
  render: () => (
    <Card>
      <Row name="XL" size="15/22">
        <span className="text-mid font-semibold">Button</span>
      </Row>
      <Row name="S" size="13/18">
        <span className="text-sm font-semibold">Button</span>
      </Row>
      <Row name="XS" size="12/16">
        <span className="text-xs font-semibold">Button</span>
      </Row>
    </Card>
  ),
}
