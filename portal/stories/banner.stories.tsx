import type { Meta, StoryObj } from '@storybook/react-vite'
import { Banner } from 'components/banner'
import { ExternalLink } from 'components/externalLink'
import { ComponentProps } from 'react'

const meta = {
  args: {
    children:
      'Hemi Earn is operated by Vetro Service & Support Corp. Hemi provides this interface only.',
  },
  argTypes: {
    children: { control: 'text' },
  },
  component: Banner,
  decorators: [
    Story => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  title: 'Components/Banner',
} satisfies Meta<ComponentProps<typeof Banner>>

export default meta

type Story = StoryObj<ComponentProps<typeof Banner>>

export const Default: Story = {}

export const WithLink: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <Banner>
      Hemi Earn is operated by Vetro Service &amp; Support Corp. Hemi provides
      this interface only.{' '}
      <ExternalLink
        className="hoverable-text font-medium underline"
        href="https://vetro.org/terms-of-use"
      >
        View Vetro&apos;s Terms of Use
      </ExternalLink>
    </Banner>
  ),
}
